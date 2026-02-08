import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { postIds } = await req.json();
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: "postIds array required" }, { status: 400 });
    }
    const uniqueIds = [...new Set(postIds)] as string[];
    const batch = adminDb.batch();
    for (const postId of uniqueIds) {
      if (typeof postId !== "string" || !postId) continue;
      const ref = adminDb.collection("posts").doc(postId);
      batch.update(ref, { impressionCount: FieldValue.increment(1) });
    }
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Analytics impression error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
