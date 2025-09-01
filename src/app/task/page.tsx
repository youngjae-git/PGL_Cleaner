// 파일 경로: src/app/task/page.tsx

import TaskLoader from '@/components/TaskLoader';
import { Suspense } from 'react';

// 이 페이지는 데이터 로딩을 담당할 클라이언트 컴포넌트를 감싸는 역할만 합니다.
export default function TaskPage() {
  return (
    // Suspense는 TaskLoader가 데이터를 불러오는 동안 fallback UI를 보여줍니다.
    <Suspense fallback={
      <main className="p-5 text-center min-h-screen flex flex-col justify-center items-center bg-background">
        <div className="card p-8 rounded-lg max-w-md w-full">
          <h1 className="text-primary text-xl font-semibold mb-2">페이지를 불러오는 중...</h1>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </main>
    }>
      <TaskLoader />
    </Suspense>
  );
}