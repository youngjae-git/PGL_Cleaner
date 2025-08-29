// 파일 경로: src/app/task/page.tsx

import TaskLoader from '@/components/TaskLoader';
import { Suspense } from 'react';

// 이 페이지는 데이터 로딩을 담당할 클라이언트 컴포넌트를 감싸는 역할만 합니다.
export default function TaskPage() {
  return (
    // Suspense는 TaskLoader가 데이터를 불러오는 동안 fallback UI를 보여줍니다.
    <Suspense fallback={
      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>페이지를 불러오는 중...</h1>
      </main>
    }>
      <TaskLoader />
    </Suspense>
  );
}