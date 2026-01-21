# OFF THE PITCH

해외축구 이적시장 뉴스를 한눈에 볼 수 있는 플랫폼입니다.

https://off-the-pitch-ivory.vercel.app/

# Overview

> 신뢰할 수 있는 기자들의 이적 뉴스를 실시간으로 확인하고, AI 요약으로 빠르게 파악하세요.

- 개발 기간: 2025.11 ~ (진행중)


| <img width="200" height="200" src="https://github.com/parkjungyuxx.png"/> |
| :-----------------------------------------------------------------------: |
|                 [박준규](https://github.com/parkjungyuxx)                 |

# 핵심 기능

- **리그 기반 피드**: 주요 유럽 리그별로 이적 뉴스 필터링
- **신뢰도 배지**: 기자의 신뢰도를 시각적으로 표시
- **기자 팔로우**: 관심 있는 기자만 선택적으로 팔로우
- **번역 기능**: OpenAI를 활용한 실시간 뉴스 번역
- **AI 일일 요약**: 어제부터 오늘까지의 이적시장 뉴스를 AI가 요약
- **다크/라이트 모드**: 사용자 선호에 맞는 테마 지원

# 기술 스택

- **Frontend**

  - Next.js 16 (App Router)
  - TypeScript
  - Tailwind CSS
  - React 19

- **Backend & Database**

  - Supabase (인증 및 데이터베이스)
  - Next.js API Routes

- **AI & External Services**

  - OpenAI API (번역 및 요약)

- **Package Manager**
  - pnpm (모노레포 워크스페이스)

# 프로젝트 구조

이 프로젝트는 **모노레포(Monorepo)** 구조로 구성되어 있습니다.

```
off-the-pitch/
├── apps/
│   └── off-the-pitch/      # Next.js 웹 애플리케이션
│       ├── app/            # Next.js App Router
│       ├── components/     # React 컴포넌트
│       ├── hooks/          # Custom React Hooks
│       ├── lib/            # 유틸리티 함수
│       └── public/         # 정적 파일
├── packages/               # 공유 라이브러리 패키지들 (향후 배포 예정)
├── memory-bank/            # 프로젝트 문서 및 컨텍스트
├── package.json            # 루트 워크스페이스 설정
├── pnpm-workspace.yaml     # pnpm 워크스페이스 설정
└── tsconfig.json           # 루트 TypeScript 설정
```
