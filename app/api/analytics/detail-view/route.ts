import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }
    const ref = adminDb.collection("posts").doc(postId);
    await ref.update({ detailViewCount: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Analytics detail-view error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
