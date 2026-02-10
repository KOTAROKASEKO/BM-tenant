import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { postId } = await req.json();
    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId is required" }, { status: 400, headers: corsHeaders });
    }

    const postRef = adminDb.collection("posts").doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404, headers: corsHeaders });
    }
    const postData = postSnap.data()!;
    if (postData.userId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
    }

    const tacFileUrl = postData.tacFileUrl;
    if (!tacFileUrl || typeof tacFileUrl !== "string") {
      return NextResponse.json({ error: "No TAC file on this listing" }, { status: 400, headers: corsHeaders });
    }

    let rawText: string;
    try {
      const res = await fetch(tacFileUrl);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const contentType = res.headers.get("content-type") || "";
      const buffer = Buffer.from(await res.arrayBuffer());
      if (!contentType.includes("pdf") && !tacFileUrl.toLowerCase().includes(".pdf")) {
        await postRef.update({
          tacAnalysisText: "AI summary is only available for PDF documents. You can still open and read the original file.",
        });
        return NextResponse.json({ success: true, message: "Non-PDF; fallback saved" }, { headers: corsHeaders });
      }
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      rawText = textResult?.text ?? "";
      await parser.destroy();
    } catch (parseErr) {
      console.error("TAC PDF parse error:", parseErr);
      await postRef.update({
        tacAnalysisText: "Unable to analyze this document. It may not be a supported PDF. You can still open and read the original file.",
      });
      return NextResponse.json({ success: true, message: "Analysis saved (fallback message)" }, { headers: corsHeaders });
    }

    if (!rawText || rawText.trim().length < 50) {
      await postRef.update({
        tacAnalysisText: "The document could not be read (too little text extracted). You can still open the original file.",
      });
      return NextResponse.json({ success: true, message: "Analysis saved (minimal text)" }, { headers: corsHeaders });
    }

    const prompt = `You are an expert in tenancy agreements and rental contracts in Malaysia. Below is the raw text extracted from a TAC (Title and Conditions) or tenancy agreement document.

Summarize it in a clear, tenant-friendly way. Use plain English. Structure your summary with short headings and bullet points where helpful. Include:
- Key terms (rent, deposit, duration)
- Notice period and renewal
- Restrictions (pets, subletting, etc.)
- Landlord/tenant obligations
- Any important clauses tenants should know

Keep the summary concise but useful (about 300–600 words). If the text is unclear or incomplete, say so and summarize what you can.

Document text:
---
${rawText.slice(0, 28000)}
---
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysisText = response.text()?.trim() ?? "";

    if (analysisText) {
      await postRef.update({ tacAnalysisText: analysisText });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("TAC analyze error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
