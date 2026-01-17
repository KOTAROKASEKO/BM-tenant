// app-tenant/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// 1. 環境変数をオブジェクトにまとめる（この時点で改行も処理しておく）
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  throw new Error(
    "Missing Firebase Admin environment variables. " +
    "Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
  );
}

// 3. アプリがまだ初期化されていない場合のみ初期化を実行
if (!admin.apps.length) {

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://whatsappclone-5ad8f-default-rtdb.firebaseio.com"
});

}

// 4. Firestoreなどのサービスをエクスポート
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();