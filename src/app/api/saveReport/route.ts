//보고서 저장 전용 API (backend logic)
// src/app/api/saveReport/route.ts

import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Admin SDK 초기화
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
      });
      console.log('Firebase Admin SDK 초기화 성공');
    } else {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 설정되지 않음');
    }
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 실패:', error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('API 호출 시작');
    
    const { 
      uid, taskId, 
      issue_message, issue_picture_url, 
      after_message, after_picture_url 
    } = await request.json();

    console.log('API 요청 데이터:', { uid, taskId, issue_message, issue_picture_url, after_message, after_picture_url });

    if (!uid || !taskId) {
      console.log('필수 필드 누락:', { uid, taskId });
      return NextResponse.json({ error: 'Missing uid or taskId' }, { status: 400 });
    }

    // Firebase Admin SDK 사용
    try {
      const db = getFirestore();
      console.log('Firestore 인스턴스 생성됨');
      
      const taskRef = db.collection('users').doc(uid).collection('tasks').doc(taskId);
      console.log('문서 참조 생성됨:', taskRef.path);

      // 기존 데이터를 먼저 가져와서 확인
      const existingDoc = await taskRef.get();
      console.log('기존 문서 존재 여부:', existingDoc.exists);
      
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        console.log('기존 데이터:', existingData);
      }

      // 부분 업데이트를 위한 데이터 구성
      const updateData: any = {
        'updated_at': new Date(),
      };

      // Issue Report인 경우
      if (issue_message || (Array.isArray(issue_picture_url) && issue_picture_url.length > 0)) {
        updateData['report.issue_message'] = issue_message || '';
        updateData['report.issue_picture_url'] = Array.isArray(issue_picture_url) ? issue_picture_url : [];
        updateData['status.issue_reported'] = true;
        console.log('Issue Report 데이터 추가됨');
      }

      // Completion Report인 경우
      if (after_message || (Array.isArray(after_picture_url) && after_picture_url.length > 0)) {
        updateData['report.after_message'] = after_message || '';
        updateData['report.after_picture_url'] = Array.isArray(after_picture_url) ? after_picture_url : [];
        updateData['status.cleaning_completed'] = true;
        console.log('Completion Report 데이터 추가됨');
      }

      console.log('최종 업데이트 데이터:', updateData);
      console.log('데이터베이스 업데이트 시도...');

      await taskRef.update(updateData);
      console.log('데이터베이스 업데이트 성공');

      return NextResponse.json({ success: true });
    } catch (firebaseError) {
      console.error('Firebase 에러:', firebaseError);
      return NextResponse.json({ 
        error: 'Firebase operation failed',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('General error:', error);
    
    // 더 자세한 에러 정보 반환
    let errorMessage = 'Failed to save report';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
}