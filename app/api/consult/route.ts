import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Your specific Admin ID
const ADMIN_USER_ID = "NUuFymD0ozZxvQLdYpL2TBRVfXi1";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // ----------------------------------------------------------------
    // 1. Save data to Firestore (consultations collection)
    // ----------------------------------------------------------------
    // This makes the data appear in your Admin App
    const docRef = await adminDb.collection("consultations").add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      status: "pending", 
      isRead: false,
    });

    console.log(`Consultation saved with ID: ${docRef.id}`);

    // ----------------------------------------------------------------
    // 2. Fetch YOUR FCM Token & Send Notification
    // ----------------------------------------------------------------
    try {
      // Go to your specific user document to get the token
      const tokenSnap = await adminDb
        .collection("users_token")
        .doc(ADMIN_USER_ID)
        .get();

      const fcmToken = tokenSnap.exists ? tokenSnap.data()?.fcmToken : null;

      if (fcmToken) {
        await adminMessaging.send({
          token: fcmToken,
          notification: {
            title: "New Consultation Request 📄",
            body: `${data.name} wants to consult about ${data.location}.`,
          },
          data: {
            type: "consultation",
            consultationId: docRef.id, // Pass ID so you can open it in the app
          },
        });
        console.log("FCM notification sent to Admin.");
      } else {
        console.warn(`No FCM token found for Admin ID: ${ADMIN_USER_ID}`);
      }
    } catch (fcmError) {
      // Log error but don't stop the request (data is already saved)
      console.error("Error sending FCM notification:", fcmError);
    }

    return NextResponse.json({ ok: true, id: docRef.id });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}