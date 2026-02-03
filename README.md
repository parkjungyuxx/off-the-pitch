# ⚽ OFF THE PITCH

해외축구 이적시장 뉴스를 효율적으로 탐색할 수 있도록 설계한 플랫폼

해외축구 이적시장 뉴스를 한눈에 확인하고, 신뢰할 수 있는 기자들의 뉴스를 실시간으로 받아보세요.
<img width="1920" height="1009" alt="off-the-pitch" src="https://github.com/user-attachments/assets/5e95f3db-2f32-48be-9bdd-770f775ce3c8" />



# 팀원 구성
| <img width="200" height="200" src="https://github.com/parkjungyuxx.png"/> |
| :-----------------------------------------------------------------------: |
|                 [박준규](https://github.com/parkjungyuxx)                 |

# 프로젝트 소개

- 해외축구 이적시장 뉴스를 효율적으로 탐색할 수 있도록 설계한 플랫폼입니다.
- 리그별로 이적 뉴스를 필터링하여 관심 있는 리그의 뉴스만 확인할 수 있습니다.
- 기자의 공신력을 3단계(🌕/🌓/🌒)로 분류하여 신뢰할 수 있는 뉴스만 선별적으로 확인할 수 있습니다.
- 관심 있는 기자를 팔로우하여 해당 기자의 뉴스만 모아볼 수 있습니다.
- OpenAI GPT-4o-mini를 활용한 실시간 번역 기능으로 해외 기사를 즉시 이해할 수 있습니다.
- 최근 24시간 수집된 뉴스 데이터를 기반으로 AI가 일일 요약을 생성하여 빠르게 이적시장 동향을 파악할 수 있습니다.

# 핵심 기능

- **리그 기반 피드**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1 등 주요 유럽 리그별로 이적 뉴스 필터링
- **기자 공신력 분류**: 1티어 → 🌕 / 2티어 → 🌓 / 3티어 → 🌒로 시각적 표시
- **기자 팔로우**: 관심 있는 기자만 선택적으로 팔로우하여 개인화된 피드 구성
- **기자 검색**: 기자 이름으로 검색하여 프로필 및 작성 뉴스 확인
- **실시간 번역**: OpenAI API를 활용한 해외 기사 실시간 번역 (Next.js API Route, 서버 사이드 API 키 관리)
- **AI 일일 요약**: 최근 24시간 수집된 뉴스 데이터를 기반으로 AI가 일일 요약 생성
- **다크/라이트 모드**: 사용자 선호에 맞는 테마 지원
- **즐겨찾기 페이지**: 팔로우한 기자들의 뉴스만 모아보기

# 기술 스택

- **Next.js 16** (App Router)
- **TypeScript**
- **React 19**
- **Tailwind CSS**
- **Supabase** (인증 및 데이터베이스)
- **OpenAI API** (GPT-4o-mini)
- **pnpm** (모노레포 워크스페이스)
- **@bongsik/infinite-scroll** (직접 개발한 무한 스크롤 라이브러리)
- **@bongsik/virtual-list** (직접 개발한 가상화 리스트 라이브러리)

# 프로젝트 구조

이 프로젝트는 **모노레포(Monorepo)** 구조로 구성되어 있습니다.

```bash
off-the-pitch/
├── apps/
│   └── off-the-pitch/              # Next.js 웹 애플리케이션
│       ├── app/                     # Next.js App Router
│       │   ├── api/                 # API Routes (번역, 요약)
│       │   ├── auth/                # 인증 처리
│       │   ├── favorites/           # 즐겨찾기 페이지
│       │   ├── journalists/         # 기자 프로필 페이지
│       │   ├── login/               # 로그인 페이지
│       │   ├── search/              # 기자 검색 페이지
│       │   └── page.tsx             # 홈 피드 페이지
│       ├── components/              # React 컴포넌트
│       │   ├── feed-post.tsx        # 피드 카드 컴포넌트
│       │   ├── sidebar.tsx          # 사이드바 컴포넌트
│       │   ├── league-selector.tsx  # 리그 선택 컴포넌트
│       │   └── ui/                  # 공통 UI 컴포넌트
│       ├── hooks/                   # Custom React Hooks
│       │   ├── use-home-page.ts     # 홈 페이지 로직
│       │   ├── use-translate.ts     # 번역 기능
│       │   ├── use-favorites.ts     # 즐겨찾기 관리
│       │   └── ...
│       ├── lib/                     # 유틸리티 함수
│       │   ├── constants.ts         # 상수 (리그, 기자 공신력 등)
│       │   ├── tweets.ts            # 트윗 데이터 페칭
│       │   ├── translate.ts         # 번역 로직
│       │   └── ...
│       └── public/                  # 정적 파일
├── packages/                        # 공유 라이브러리 패키지
│   ├── infinite-scroll/            # 무한 스크롤 라이브러리
│   └── virtual-list/               # 가상화 리스트 라이브러리
├── memory-bank/                    # 프로젝트 문서 및 컨텍스트
├── package.json                    # 루트 워크스페이스 설정
├── pnpm-workspace.yaml             # pnpm 워크스페이스 설정
└── tsconfig.json                   # 루트 TypeScript 설정
```

# 역할 분담

## 🥷 박준규 (1인 프로젝트)

### 프로젝트 기획 및 설계

- 해외축구 이적시장 뉴스 플랫폼 컨셉 기획
- 기자 공신력 분류 시스템 설계 (1티어~3티어 → 3단계 시각화)
- 리그 기반 필터링 시스템 설계

### 무한 스크롤 및 가상화 리스트 라이브러리 개발

- **@bongsik/infinite-scroll** 라이브러리 개발
  - Intersection Observer API 기반 무한 스크롤 훅 구현
  - 데이터 페칭과 완전히 분리된 순수한 스크롤 감지 로직
  - 방향별 트리거 제어, 커스텀 스크롤 컨테이너 지원, 중복 호출 방지
  - npm 패키지로 배포 및 문서화
- **@bongsik/virtual-list** 라이브러리 개발
  - 이진 탐색 기반 가상화 리스트 구현
  - ResizeObserver를 활용한 동적 높이 아이템 자동 측정
  - requestAnimationFrame과 overscan 전략으로 빠른 스크롤 환경에서도 렌더링 성능 유지
  - npm 패키지로 배포 및 문서화
- **테스트 및 CI/CD**
  - Vitest, React Testing Library 기반 테스트 코드 작성
  - 무한 스크롤 라이브러리 테스트 커버리지 100% 달성
  - 가상화 리스트 라이브러리 테스트 커버리지 93% 달성
  - GitHub Actions CI로 자동화

### 데이터 수집 및 관리

- 해외축구 이적시장 뉴스를 수집하는 크롤러 도구 개발
- 준실시간으로 데이터를 수집해 Supabase DB에 자동 저장
- Supabase MCP(Model Context Protocol)를 활용해 AI 도구가 실제 데이터베이스 스키마를 참조하도록 구성
- 잘못된 컬럼 접근이나 스키마 불일치로 발생할 수 있는 쿼리 오류 방지

### AI 기반 기능 구현

- **번역 기능**
  - OpenAI GPT-4o-mini를 활용한 해외 기사 번역 기능 구현
  - Next.js API Route로 서버 사이드 API 키 관리
  - 실시간 번역 결과 표시 및 원문/번역문 토글 기능
- **AI 일일 요약**
  - 최근 24시간 수집된 뉴스 데이터를 기반으로 비동기 번역 처리 후 AI 일일 요약 생성
  - 일일 요약 모달 UI 구현

### 성능 최적화

- 직접 개발한 `@bongsik/infinite-scroll` 및 `@bongsik/virtual-list` 라이브러리 적용
- 대량 데이터 렌더링 시 발생하던 초기 로딩 지연과 스크롤 성능 저하 개선
- IntersectionObserver 기반 무한 스크롤로 데이터를 점진적으로 로딩
- ResizeObserver 기반 동적 높이 측정과 가상화 렌더링을 통해 뷰포트 내 아이템만 DOM에 렌더링

### 프로젝트 관리

- **모노레포 구조 활용**
  - pnpm workspace 기반 모노레포 구조 구축
  - 라이브러리와 애플리케이션을 분리 관리
  - 직접 개발한 라이브러리를 프로젝트 내부에서 직접 참조하여 사용
  - 외부 패키지 설치 없이 변경 사항을 실시간으로 반영하며 개발

### UI/UX 구현

- 리그 선택기 컴포넌트 구현 (리그별 필터링)
- 피드 카드 컴포넌트 구현 (기자 정보, 공신력 배지, 번역 기능, 팔로우 버튼)
- 사이드바 컴포넌트 구현 (홈, 검색, 즐겨찾기, 테마 토글)
- 기자 프로필 페이지 구현
- 기자 검색 페이지 구현
- 즐겨찾기 페이지 구현
- 다크/라이트 모드 지원

### 상태 관리 및 데이터 페칭

- Supabase를 활용한 인증 및 데이터베이스 연동
- 커스텀 훅을 통한 상태 관리 (`use-home-page`, `use-favorites`, `use-journalist-profile` 등)
- React 19의 `useOptimistic`을 활용한 낙관적 업데이트 구현
- `startTransition`을 활용한 React 19 호환성 확보

## 개발 기간

- 전체 개발 기간: 2024. 11 ~ (진행중)

## 🚀 Getting Started

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```
