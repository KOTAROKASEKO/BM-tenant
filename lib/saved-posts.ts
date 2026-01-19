// lib/saved-posts.ts
import { db, auth } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

/**
 * Toggle save status of a post
 * @param postId - The ID of the post to save/unsave
 * @returns Promise<boolean> - true if saved, false if unsaved
 */
export async function toggleSavePost(postId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be logged in to save posts");
  }

  const savedPostRef = doc(db, "users", user.uid, "savedPosts", postId);
  const savedPostSnap = await getDoc(savedPostRef);

  if (savedPostSnap.exists()) {
    // Unsave: delete the document
    await deleteDoc(savedPostRef);
    return false;
  } else {
    // Save: create the document with timestamp
    await setDoc(savedPostRef, {
      postId,
      savedAt: new Date(),
    });
    return true;
  }
}

/**
 * Check if a post is saved by the current user
 * @param postId - The ID of the post to check
 * @returns Promise<boolean> - true if saved, false otherwise
 */
export async function isPostSaved(postId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  const savedPostRef = doc(db, "users", user.uid, "savedPosts", postId);
  const savedPostSnap = await getDoc(savedPostRef);
  return savedPostSnap.exists();
}

/**
 * Get all saved post IDs for the current user
 * @returns Promise<string[]> - Array of saved post IDs
 */
export async function getSavedPostIds(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    const savedPostsRef = collection(db, "users", user.uid, "savedPosts");
    const snapshot = await getDocs(savedPostsRef);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching saved post IDs:", error);
    return [];
  }
}
