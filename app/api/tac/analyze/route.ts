import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText, getDocumentProxy } from "unpdf";

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
    const body = await req.json().catch(() => ({}));
    const postId = typeof body?.postId === "string" ? body.postId : null;
    console.log("[TAC analyze] POST received", postId ? `postId=${postId}` : "(no postId)");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!postId) {
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
      console.log("[TAC analyze] 400: No TAC file on this listing. postId=", postId, "has tacFileUrl:", !!tacFileUrl);
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
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      rawText = (text ?? "").trim();
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

    const prompt = `You are an expert in tenancy agreements and rental contracts in Malaysia.

the question is: is it ok to sign up this form? please read through it and let me know if there is any suspicious information.

Output rules:
- Keep the response conciese.
- Then list major problems
- Ignore minor details.
- If no serious issue, say: "No major risk found."

TAC text:
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
