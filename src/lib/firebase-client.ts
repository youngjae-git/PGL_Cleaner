// 파일 경로: src/lib/firebase-client.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore"; // <-- 이 줄이 추가되었습니다!

// Firebase 설정값 (환경 변수에서 가져옴)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- 디버깅 로그 (그대로 둡니다) ---
console.log("================================================");
console.log("🔥 Firebase 클라이언트 설정값을 확인합니다 (.env.local)");
console.log("🔥 Project ID:", firebaseConfig.projectId);
console.log("🔥 Storage Bucket:", firebaseConfig.storageBucket);
console.log("================================================");
// ------------------------------------------

// Next.js 환경에서 Firebase 앱이 중복으로 초기화되는 것을 방지합니다.
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app, "gs://pinggle-a24a8.firebasestorage.app");
const db: Firestore = getFirestore(app); // 이제 이 함수를 정상적으로 사용할 수 있습니다.

export { app, db, storage, auth };
