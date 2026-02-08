import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DAILY_LIMIT = 5;
const DEVELOPER_UIDS = ["tk7eS3choSb6E76sYqnnWy0wL0n1"];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { propertyId, propertyLocation, lang: preferredLang } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    const isDeveloper = DEVELOPER_UIDS.includes(uid);
    let allowed = isDeveloper;

    if (!isDeveloper) {
      const statsRef = adminDb.collection("user_usage_stats").doc(uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await adminDb.runTransaction(async (t) => {
        const doc = await t.get(statsRef);
        const data = doc.data();
        if (!doc.exists || !data?.lastAssessmentDate || data.lastAssessmentDate.toDate() < today) {
          t.set(statsRef, { dailyAssessmentCount: 1, lastAssessmentDate: new Date() }, { merge: true });
          allowed = true;
        } else {
          if ((data.dailyAssessmentCount || 0) < DAILY_LIMIT) {
            t.update(statsRef, {
              dailyAssessmentCount: FieldValue.increment(1),
              lastAssessmentDate: new Date(),
            });
            allowed = true;
          }
        }
      });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Daily limit reached (5/5). Try again tomorrow!" }, { status: 403 });
    }

    const userDoc = await adminDb.collection("users_prof").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Profile not found. Please complete your profile." }, { status: 404 });
    }

    const userData = userDoc.data();
    const userName = userData?.displayName || "User";
    const destination = userData?.workLocation || userData?.schoolLocation || userData?.preferredAreas?.[0] || "KL Sentral";
    const origin = propertyLocation || "Kuala Lumpur";
    const budget = userData?.budget ? `RM ${userData.budget}` : "Not specified";
    const preferences = userData?.selfIntroduction || "";

    const langMap: Record<string, string> = { ja: "日本語", en: "English" };
    const outputLanguage = langMap[preferredLang === "ja" ? "ja" : "en"] ?? "English";

    // Markdown prompt for streaming - outputs readable text as it generates
    const prompt = `
あなたはマレーシアの不動産エキスパートです。以下のユーザーに対して、指定された物件エリアの「住みやすさ」を診断してください。

【重要】回答はすべて ${outputLanguage} で、Markdown形式で記述してください。ストリーミングで表示されるため、自然な読み物として出力してください。

【ユーザー情報】
- 名前: ${userName}
- 通勤/通学先: ${destination}
- 予算: ${budget}
- その他希望: ${preferences}

【物件エリア】
- 場所: ${origin}

【タスク】
以下の形式でMarkdownを出力してください。見出しや箇条書きを適宜使ってください。

1. 最初に "## Your Score: X/100" のようにスコア（0-100）を出してください
2. 次に **Commute to ${destination}**: の形式で通勤時間と手段（例: ~25-35 mins via LRT）を簡潔に
3. "### If you live here..." の見出しの下に、2〜4文で総合的な印象（通勤・利便性・食生活）
4. "### Commute Analysis" の見出しの下に、通勤に関する具体的で率直なアドバイス
5. "### Life & Convenience" の見出しの下に、スーパー・コンビニ・飲食店（ホーカー含む）の充実度と具体的なメリット・デメリット

すべて ${outputLanguage} で、ユーザーに語りかける形で書いてください。`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text?.() ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Assessment Stream Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
