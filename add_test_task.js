// Firebase Admin SDK를 사용하여 테스트용 task 추가
// add_test_task.js

const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addTestTask() {
  try {
    const userId = 'Zlmk1yX5qRXJJyMSAbLtXI1JKIa2';
    const taskId = 'test_task_cleaning_time';
    
    // 오늘 날짜 기준으로 시간 설정
    const today = new Date();
    const cleaningStartTime = new Date(today);
    cleaningStartTime.setHours(16, 0, 0, 0); // 오후 4시
    
    const cleaningEndTime = new Date(today);
    cleaningEndTime.setHours(18, 0, 0, 0); // 오후 6시
    
    // Firestore Timestamp로 변환
    const startTimestamp = admin.firestore.Timestamp.fromDate(cleaningStartTime);
    const endTimestamp = admin.firestore.Timestamp.fromDate(cleaningEndTime);
    
    const testTaskData = {
      uid: userId,
      property_id: 'ZgCYlFxoFGUaKbhEkelH',
      summary: 'Reserved',
      start_date: admin.firestore.Timestamp.fromDate(new Date('2025-09-15T14:00:00Z')),
      end_date: admin.firestore.Timestamp.fromDate(new Date('2025-09-18T11:00:00Z')),
      cleaning_start_time: startTimestamp,  // 오늘 오후 4시
      cleaning_end_time: endTimestamp,      // 오늘 오후 6시
      created_at: admin.firestore.Timestamp.fromDate(new Date()),
      updated_at: admin.firestore.Timestamp.fromDate(new Date()),
      cleaner_info: {
        id: 'cleaner_kim_456',
        name: '김청소',
        phone_number: '+821012345678',
        nation: 'South Korea'
      },
      report: {
        issue_message: '',
        issue_picture_url: '',
        after_message: '',
        after_picture_url: ''
      },
      reminders_sent: {
        day_before: false,
        hour_before: false
      },
      status: {
        cleaning_completed: false,
        issue_reported: false,
        issue_resolved: false
      }
    };
    
    // Firestore에 문서 추가
    await db.collection('users').doc(userId).collection('tasks').doc(taskId).set(testTaskData);
    
    console.log('✅ 테스트 task가 성공적으로 추가되었습니다!');
    console.log(`📍 경로: users/${userId}/tasks/${taskId}`);
    console.log(`🕐 청소 시작 시간: ${cleaningStartTime.toLocaleString('ko-KR')}`);
    console.log(`🕐 청소 종료 시간: ${cleaningEndTime.toLocaleString('ko-KR')}`);
    console.log(`🔗 테스트 URL: /task?uid=${userId}&taskId=${taskId}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addTestTask();
