# CV팀 DDD 대시보드 — 개발 페이즈

> 체크박스: `[ ]` 미완료 / `[x]` 완료

---

## Phase 1. Supabase 스키마 설계 및 적용

### 1-1. 테이블 생성
- [x] `profiles` 테이블 생성 (auth.users 연동)
- [x] `brick_master` 테이블 생성
- [x] `uploads` 테이블 생성
- [x] `monthly_ddd` 테이블 생성 (복합 UNIQUE 키 포함)

### 1-2. 인덱스 및 뷰
- [x] `monthly_ddd` 마켓쉐어 쿼리 인덱스 생성 (`ingredient_market, year_month, brick_code`)
- [x] `brick_master` 사업부 인덱스 생성
- [x] `v_division_market_share` 뷰 생성
- [x] `v_hospital_market_share` 뷰 생성

### 1-3. RLS 정책
- [x] `profiles` RLS 설정 (본인만 수정, admin은 전체 조회)
- [x] `monthly_ddd` RLS 설정 (읽기: 인증 사용자, 쓰기: admin)
- [x] `brick_master` RLS 설정
- [x] `uploads` RLS 설정

### 1-4. 타입 및 검증
- [x] TypeScript 타입 생성 (`mcp__supabase__generate_typescript_types`)
- [x] Supabase Performance Advisor 확인 (`mcp__supabase__get_advisors`)

---

## Phase 2. Next.js 프로젝트 초기 설정

### 2-1. 프로젝트 생성
- [x] `npx create-next-app@latest` 실행 (App Router, TypeScript, Tailwind)
- [x] 디렉토리 구조 생성 (`app/`, `components/`, `lib/`, `types/`)

### 2-2. 패키지 설치
- [x] `@supabase/supabase-js` + `@supabase/ssr` 설치
- [x] `recharts` 설치
- [x] `xlsx` (SheetJS) 설치
- [x] `papaparse` + `@types/papaparse` 설치

### 2-3. Supabase 클라이언트 설정
- [x] `.env.local` 환경변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [x] `lib/supabase/client.ts` 생성 (브라우저용 클라이언트)
- [x] `lib/supabase/server.ts` 생성 (Server Component용 클라이언트)
- [x] `lib/supabase/middleware.ts` 생성 (미들웨어용 클라이언트)

### 2-4. 공통 레이아웃
- [x] `app/layout.tsx` 루트 레이아웃 (폰트, 메타데이터)
- [x] `components/gnb/GNB.tsx` 상단 내비게이션 바
- [x] `app/(dashboard)/layout.tsx` 대시보드 공통 레이아웃

---

## Phase 3. 인증 시스템 구현

### 3-1. 미들웨어
- [x] `middleware.ts` 세션 쿠키 검증 로직
- [x] 미인증 접근 시 `/login` 리다이렉트
- [x] 로그인 상태에서 `/login` 접근 시 `/` 리다이렉트

### 3-2. 로그인 페이지 (`/login`)
- [x] `app/(auth)/login/page.tsx` UI 구현 (이메일/비밀번호 폼)
- [x] Supabase `signInWithPassword` 연동
- [x] 로그인 성공 시 `/` 리다이렉트
- [x] 오류 메시지 표시 (잘못된 이메일/비밀번호)

### 3-3. 사용자 프로필
- [x] Supabase Auth 트리거로 `profiles` 자동 생성 설정
- [ ] 초기 admin 계정 생성 (Supabase Dashboard에서)

---

## Phase 4. Excel 업로드 기능 (`/upload`)

### 4-1. 업로드 UI
- [ ] `app/(dashboard)/upload/page.tsx` — 업로드 이력 조회 (Server Component)
- [ ] `components/upload/UploadForm.tsx` — Drag & Drop UI (Client Component)
- [ ] 파일 형식 검증 (`.xlsx`만 허용), 50MB 크기 제한
- [ ] 파일 선택 후 미리보기 (시트 감지 여부 + 첫 5행 테이블)

### 4-2. Excel 파싱 로직
- [ ] `lib/excel/parseExcel.ts` — SheetJS로 시트 자동 감지 (raw / 브릭마스터)
- [ ] `lib/excel/wideToLong.ts` — `Jan 2024`~`Dec 2025` 컬럼 → `year_month` 행 변환
- [ ] `lib/excel/parseIngredient.ts` — `Pack Molecule String` 파싱 (Gx 여부 판별)
- [ ] 자사 제품(`제품` 컬럼) vs 경쟁사 분류 로직
- [ ] `ddd_qty = 0` 행 필터링

### 4-3. DB 저장 (Server Action)
- [ ] `app/(dashboard)/upload/actions.ts` — `processUpload` Server Action
- [ ] `uploads` 테이블 레코드 생성 (`status: 'processing'`)
- [ ] Supabase Storage에 원본 파일 저장 (`excel-uploads` 버킷)
- [ ] `brick_master` upsert (청크 단위, 500행씩)
- [ ] `monthly_ddd` upsert (청크 단위, 1,000행씩)
- [ ] 완료 후 `status: 'done'`, `row_count` 업데이트
- [ ] 오류 시 `status: 'error'`, `error_message` 저장

### 4-4. 진행상태 UI
- [ ] Supabase Realtime으로 `uploads` 테이블 변화 구독
- [ ] 진행률 Progress Bar 표시
- [ ] 업로드 이력 목록 (파일명 / 일시 / 행 수 / 상태 배지)

---

## Phase 5. 전체 현황 대시보드 (`/`)

### 5-1. 데이터 조회
- [ ] `lib/queries/overview.ts` — 사업부별 월간 DDD 집계 쿼리
- [ ] `lib/queries/overview.ts` — 전달 대비 성장률 계산 로직

### 5-2. UI 구현
- [ ] 월 선택 필터 (Jan 2024 ~ Dec 2025)
- [ ] 자사 4제품 DDD 합계 카드 (리퀴시아 / 프리그렐 / 딜라트렌 / 베르쿠보)
- [ ] `components/charts/DivisionBarChart.tsx` — 사업부별 Total DDD Bar Chart
- [ ] 각 사업부 카드에 전달 대비 성장률 ▲▼ 배지 표시
- [ ] 사업부 카드 클릭 → `/divisions/[division]` 이동

---

## Phase 6. 사업부 대시보드 (`/divisions/[division]`)

### 6-1. 데이터 조회
- [ ] `lib/queries/division.ts` — `v_division_market_share` 뷰 조회
- [ ] 성분시장별 마켓쉐어 집계
- [ ] 오리지널 / 제네릭 비율 집계
- [ ] 소속 병원 목록 + 전달 대비 성장률

### 6-2. UI 구현
- [ ] `components/charts/MarketShareDonut.tsx` — 성분시장별 Donut Chart (4개)
- [ ] `components/charts/OriginalGenericBar.tsx` — 오리지널/제네릭 Stacked Bar Chart
- [ ] 병원 목록 테이블 (병원명 / 종합구분 / 총 DDD / 성장률)
- [ ] 테이블 정렬 기능 (DDD / 성장률)
- [ ] 병원 행 클릭 → `/divisions/[division]/hospitals/[brickCode]` 이동

---

## Phase 7. 병원 대시보드 (`/divisions/[division]/hospitals/[brickCode]`)

### 7-1. 데이터 조회
- [ ] `lib/queries/hospital.ts` — `v_hospital_market_share` 뷰 조회
- [ ] 성분시장별 12개월 추이 데이터
- [ ] 당월 마켓쉐어 % + 전달 대비 성장률

### 7-2. UI 구현
- [ ] 성분시장 탭 (해당 병원에서 자사 제품이 속한 시장만 표시)
- [ ] `components/charts/TrendLineChart.tsx` — 마켓쉐어 추이 Line Chart (최근 12개월)
- [ ] 당월 마켓쉐어 % + 전달 대비 성장률 강조 수치 카드
- [ ] 오리지널/제네릭 Donut Chart (탭별)
- [ ] 제품별 DDD Bar Chart (경쟁사 포함, 탭별)
- [ ] 브레드크럼 내비게이션 (전체 → 사업부 → 병원)

---

## Phase 8. 고도화 및 마무리

### 8-1. UI/UX 개선
- [ ] 전체 페이지 반응형 레이아웃 (모바일 / 태블릿 / 데스크톱)
- [ ] 로딩 상태 Skeleton UI (`loading.tsx` 파일)
- [ ] 에러 상태 UI (`error.tsx` 파일)
- [ ] 데이터 없을 때 Empty State 처리

### 8-2. 성능 최적화
- [ ] `monthly_ddd` 대용량 쿼리 최적화 (쿼리 플랜 확인)
- [ ] Next.js `unstable_cache` 또는 `revalidatePath` 적용
- [ ] 차트 컴포넌트 `React.memo` 적용

### 8-3. 배포
- [ ] Vercel 배포 설정
- [ ] 환경변수 등록 (Vercel Dashboard)
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] Supabase 프로덕션 RLS 최종 확인

---

## 진행 현황

| 페이즈 | 항목 수 | 완료 | 진행률 |
|--------|---------|------|--------|
| Phase 1. Supabase 스키마 | 11 | 11 | 100% ✅ |
| Phase 2. Next.js 초기 설정 | 13 | 13 | 100% ✅ |
| Phase 3. 인증 시스템 | 8 | 7 | 87% |
| Phase 4. Excel 업로드 | 15 | 0 | 0% |
| Phase 5. 전체 현황 대시보드 | 7 | 0 | 0% |
| Phase 6. 사업부 대시보드 | 9 | 0 | 0% |
| Phase 7. 병원 대시보드 | 9 | 0 | 0% |
| Phase 8. 고도화 및 마무리 | 10 | 0 | 0% |
| **합계** | **82** | **31** | **38%** |
