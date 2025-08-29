// 파일 경로: src/components/TaskLoader.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReportForm from '@/components/ReportForm';
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from '@/lib/firebase-client';
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase-client';

// 백엔드 API에서 받아올 Task 데이터의 타입을 정의합니다.
interface TaskData {
  uid: string;
  taskId: string;
  summary: string;
  customToken: string;
  property_id?: string;
  cleaner_id: string;
  status: any;
  report: any;
  cleaning_start_time: { _seconds: number; _nanoseconds: number };
  cleaning_end_time: { _seconds: number; _nanoseconds: number };
  [key: string]: any;
}

// 백엔드 API의 전체 응답 타입을 정의합니다.
interface ApiResponse {
  success: boolean;
  task?: TaskData;
  error?: string;
}

// Property Name 검색 함수
const fetchPropertyName = async (propertyId: string | undefined, uid: string): Promise<string> => {
  if (!propertyId) return 'Not Set';
  
  try {
    // Property ID 정규화 (받은 ID를 실제 Firestore 문서 ID와 매칭)
    const normalizePropertyId = (id: string) => {
      // 정확한 변환 규칙 적용
      let normalized = id;
      
      // |H -> lH 변환만 수행 (l을 1로 변환하지 않음)
      normalized = normalized.replace(/\|H$/, 'lH');
      
      console.log("Normalization steps:");
      console.log("  Original ID:", id);
      console.log("  Final normalized ID:", normalized);
      
      return normalized;
    };
    
    const normalizedPropertyId = normalizePropertyId(propertyId);
    console.log("Original Property ID:", propertyId);
    console.log("Normalized Property ID:", normalizedPropertyId);
    
    // 3개 경로를 병렬로 검색하여 가장 빠른 결과 반환
    const searchPaths = [
      // 방법 1: users/{userId}/properties/{normalizedPropertyId}
      getDoc(doc(db, "users", uid, "properties", normalizedPropertyId)),
      // 방법 2: properties/{normalizedPropertyId}
      getDoc(doc(db, "properties", normalizedPropertyId)),
      // 방법 3: accommodations/{normalizedPropertyId}
      getDoc(doc(db, "accommodations", normalizedPropertyId))
    ];
    
    const results = await Promise.allSettled(searchPaths);
    
    // 첫 번째로 찾은 결과 반환
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value.exists()) {
        const propertyName = result.value.data().name || 'Name Not Found';
        const pathNames = ['users/properties', 'properties', 'accommodations'];
        console.log(`Property Name found in ${pathNames[i]}:`, propertyName);
        return propertyName;
      }
    }
    
    console.log("Property document not found in any collection");
    console.log("Searched paths:");
    console.log("1. users/", uid, "/properties/", normalizedPropertyId);
    console.log("2. properties/", normalizedPropertyId);
    console.log("3. accommodations/", normalizedPropertyId);
    
    return 'Not Set';
  } catch (error) {
    console.error("Error fetching property name:", error);
    return 'Not Set';
  }
};

// URL의 토큰을 읽어와 데이터를 불러오고, 상태에 따라 UI를 렌더링하는 핵심 컴포넌트입니다.
export default function TaskLoader() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t'); // URL 쿼리에서 't' 파라미터(보안 토큰)를 가져옵니다.

  // 데이터, 로딩 상태, 에러를 관리하기 위한 React State 변수들입니다.
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트가 처음 렌더링될 때 이 로직이 실행됩니다.
    if (!token) {
      setError('Invalid URL. Authentication token is required.');
      setIsLoading(false);
      return;
    }

    const verifyAndFetchTask = async () => {
      setIsLoading(true);
      try {
        // 1. 백엔드의 verify_task_token 함수를 호출하여 보안 토큰을 검증합니다.
        const verifyUrl = `https://us-central1-pinggle-a24a8.cloudfunctions.net/verify_task_token?t=${token}`;
        const response = await fetch(verifyUrl);
        const result: ApiResponse = await response.json();

        if (response.ok && result.success && result.task) {
          // 2. 백엔드로부터 받은 커스텀 로그인 토큰으로 Firebase에 자동으로 로그인합니다.
          console.log("--- DEBUG: Custom token received from backend ---");
          console.log(result.task.customToken);
          console.log("--- DEBUG: Task data received from backend ---");
          console.log("Property ID:", result.task.property_id);
          console.log("Property Name:", result.task.property_name);
          console.log("Cleaner Name:", result.task.cleaner_name);
          console.log("All available keys:", Object.keys(result.task));
          console.log("Full task data:", result.task);
          console.log("-----------------------------------------");

          const auth = getAuth(app);
          
          // 3. Firebase Auth와 Property Name 검색을 병렬로 실행
          const [authResult, propertyName] = await Promise.all([
            signInWithCustomToken(auth, result.task.customToken),
            fetchPropertyName(result.task.property_id, result.task.uid)
          ]);
          
          console.log("Successfully logged in to Firebase! UID:", auth.currentUser?.uid);

          // 4. 접근 시간 유효성 검사를 수행합니다.
          const now = new Date();
          const startTime = new Date(result.task.cleaning_start_time._seconds * 1000);
          const endTime = new Date(result.task.cleaning_end_time._seconds * 1000);

          if (now < startTime || now > endTime) {
            setError(`This link is only valid from ${startTime.toLocaleString('en-US')} to ${endTime.toLocaleString('en-US')}.`);
          } else {
            // 5. 모든 검사를 통과하면, 받은 task 데이터를 state에 저장하여 화면을 렌더링합니다.
            // Property Name을 포함한 완전한 task 데이터 생성
            const completeTaskData = {
              ...result.task,
              property_name: propertyName
            };
            setTaskData(completeTaskData);
          }
        } else {
          // API에서 에러를 반환한 경우 (예: 만료된 토큰, 존재하지 않는 작업 등)
          setError(result.error || 'Failed to verify token.');
        }
      } catch (e: any) {
        // 네트워크 오류 또는 로그인 실패 등 예기치 못한 에러 처리
        setError(`An error occurred: ${e.message}`);
        console.error("Verification or Sign-in failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFetchTask();
  }, [token]); // 이 useEffect는 token 값이 바뀔 때만 다시 실행됩니다.

  // --- 현재 상태에 따라 다른 UI를 보여줍니다 ---

  if (isLoading) {
    return (
      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Verifying authentication information...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🚫 Access Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </main>
    );
  }

  if (taskData) {
    // 최종적으로 데이터 로딩에 성공하면 ReportForm을 렌더링합니다.
    return <ReportForm task={taskData} uid={taskData.uid} taskId={taskData.taskId} />;
  }

  // 위 조건에 아무것도 해당하지 않는 경우
  return null;
}
