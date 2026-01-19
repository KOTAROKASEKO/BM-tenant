import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin"; 
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1日あたりの制限回数
const DAILY_LIMIT = 5;

// 開発者IDリスト（制限をバイパス）
const DEVELOPER_UIDS = [
  'tk7eS3choSb6E76sYqnnWy0wL0n1'
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // 1. 認証チェック
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { propertyId, propertyLocation } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // 2. 開発者バイパスチェック
    const isDeveloper = DEVELOPER_UIDS.includes(uid);
    let allowed = isDeveloper;

    // 3. 回数制限チェック (開発者でない場合のみ)
    if (!isDeveloper) {
      const statsRef = adminDb.collection("user_usage_stats").doc(uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await adminDb.runTransaction(async (t) => {
        const doc = await t.get(statsRef);
        const data = doc.data();

        // データがない、または日付が変わっている場合はリセット
        if (!doc.exists || !data?.lastAssessmentDate || data.lastAssessmentDate.toDate() < today) {
          t.set(statsRef, {
            dailyAssessmentCount: 1,
            lastAssessmentDate: new Date()
          }, { merge: true });
          allowed = true;
        } else {
          // 制限以内ならカウントアップ
          if ((data.dailyAssessmentCount || 0) < DAILY_LIMIT) {
            t.update(statsRef, {
              dailyAssessmentCount: FieldValue.increment(1),
              lastAssessmentDate: new Date()
            });
            allowed = true;
          }
        }
      });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Daily limit reached (5/5). Try again tomorrow!" }, { status: 403 });
    }

    // 4. データ取得 (User Profile & Property)
    const userDoc = await adminDb.collection("users_prof").doc(uid).get();
    
    // ユーザープロファイルが存在しない場合
    if (!userDoc.exists) {
        return NextResponse.json({ error: "Profile not found. Please complete your profile." }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // ユーザー情報の整理
    const userName = userData?.displayName || "User";
    const destination = userData?.workLocation || userData?.schoolLocation || userData?.preferredAreas?.[0] || "KL Sentral";
    const origin = propertyLocation || "Kuala Lumpur";
    const budget = userData?.budget ? `RM ${userData.budget}` : "Not specified";
    const preferences = userData?.selfIntroduction || "";

    // 5. Geminiへのプロンプト作成 (具体的かつパーソナライズされた指示)
    const prompt = `
      あなたはマレーシアの不動産エキスパートです。以下のユーザーに対して、指定された物件エリアの「住みやすさ」を診断してください。
      
      【ユーザー情報】
      - 名前: ${userName}
      - 通勤/通学先: ${destination}
      - 予算: ${budget}
      - その他希望: ${preferences}

      【物件エリア】
      - 場所: ${origin}

      【タスク】
      以下のJSON形式で出力してください。Markdownのコードが必要です。生JSONのみを返してください。
      特に "comment" フィールドでは、"${userName}さんがここに住む場合..." という書き出しで、
      スーパー、コンビニ、飲食店（レストラン・ホーカー）の充実度を含めて、
      「駅は近いけれど飲食店が少ない」「スーパーが遠いので自炊派には不便かも」といった具体的なメリット・デメリットを指摘してください。

      【出力フォーマット (JSON)】
      {
        "score": (0-100の整数),
        "commute": {
          "origin": "${origin}",
          "destination": "${destination}",
          "duration": "(例: 25-35 mins)",
          "mode": "(例: Train (LRT Kelana Jaya Line))",
          "details": "(通勤ルートの簡潔な説明)"
        },
        "convenience": {
          "rating": "(High / Medium / Low)",
          "highlights": ["(近くのスーパー名)", "(近くのモール名)", "(その他施設)"]
        },
        "comment": "(ここ重要: ${userName}さんに向けた、周辺環境（食・買い物）に関する具体的で率直なアドバイス。日本語で記述)"
      }
    `;

    // 6. Gemini API 呼び出し
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONパース（Markdown記法が含まれる場合の除去処理含む）
    let jsonResponse;
    try {
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      // パース失敗時のフォールバック
      jsonResponse = {
        score: 75,
        commute: { duration: "Unknown", mode: "Check Map", details: "Could not analyze commute." },
        convenience: { rating: "Medium", highlights: [] },
        comment: `${userName}さん、申し訳ありません。AIによる解析に失敗しましたが、${origin}は一般的に人気のあるエリアです。`
      };
    }

    return NextResponse.json({ 
        success: true, 
        data: jsonResponse 
    });

  } catch (error: any) {
    console.error("Assessment Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}