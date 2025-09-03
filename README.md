# Pinggle Cleaner

Firebase와 Next.js를 활용한 스마트 청소 관리 시스템

## 🚀 프로젝트 개요

Pinggle Cleaner는 효율적인 청소 업무 관리를 위한 웹 애플리케이션입니다. 사용자는 청소 업무를 등록하고 진행 상황을 실시간으로 추적할 수 있습니다.

## ✨ 주요 기능

- 📋 청소 업무 등록 및 관리
- 📊 실시간 진행 상황 추적
- 📱 반응형 디자인 (모바일/데스크톱 최적화)
- 🌓 라이트/다크 모드 지원
- 🔥 Firebase 실시간 데이터베이스 연동

## 🛠 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: Vercel

## 🚀 시작하기

### 필수 요구사항

- Node.js 22.x
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/youngjae-git/PGL_Cleaner.git
cd PGL_Cleaner
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 Firebase 설정을 추가하세요:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── saveReport/
│   │       └── route.ts
│   ├── task/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ClientOnly.tsx
│   ├── ReportForm.tsx
│   └── TaskLoader.tsx
└── lib/
    └── firebase-client.ts
```

## 🎨 UI/UX 특징

- **접근성**: 고대비 모드 지원 및 WCAG 가이드라인 준수
- **반응형**: 모바일, 태블릿, 데스크톱 최적화
- **테마**: 자동 다크/라이트 모드 전환
- **성능**: Next.js 14의 최신 기능 활용

## 🚀 배포

이 프로젝트는 Vercel에 배포되어 있습니다.

- **Live Demo**: [pgl-cleaner.vercel.app](https://pgl-cleaner.vercel.app)

### Vercel 배포 설정

1. Vercel 계정에 GitHub 저장소 연결
2. 환경 변수 설정 (Firebase 설정)
3. 자동 배포 활성화

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

- GitHub: [@youngjae-git](https://github.com/youngjae-git)
- 프로젝트 링크: [https://github.com/youngjae-git/PGL_Cleaner](https://github.com/youngjae-git/PGL_Cleaner)