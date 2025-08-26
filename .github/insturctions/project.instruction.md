# 프로젝트 개발 가이드 (Commando POC)
# Next.js 15 + React 19 + Tailwind CSS 4 + shadcn/ui + Zustand

> 이 문서는 **Commando**: "군(軍) 환경 내 스테이블 코인 활용 시나리오 데모" POC 프로젝트를 위한 개발/운영 지침입니다. 실서비스가 아닌 **학습·컨셉 증명(PoC)** 목적이며, 모든 사용자 입력 데이터는 브라우저 **localStorage에만 저장**되고 외부 네트워크 송신을 하지 않는다는 제약을 가집니다.

## 1. 개요
현재 레포 (`commando`)에서 Next.js 기반 UI를 개발할 때 **shadcn/ui 컴포넌트 시스템**과 **Zustand 상태 관리**를 효율적으로 도입·운영하고, 군 환경 내 가상의 스테이블 코인(Stablecoin) 활용 흐름(예: 보급품 결제/정산, 임무비 배분, 자산 전송 로그)을 **로컬 시뮬레이션**하기 위한 가이드입니다. 모든 데이터는 클라이언트 사이드에 머무르며 API / DB 백엔드가 없습니다.

### 1.1 POC 핵심 제약
| 항목 | 제약 | 비고 |
|------|------|------|
| 데이터 영속성 | localStorage only | 민감/실제 자산 없음, 브라우저 삭제 시 초기화 |
| 네트워크 통신 | 금지 (fetch/XHR/WebSocket) | 단, 정적 asset / Next 내부 RSC는 허용 |
| 보안 | 암호화 선택 | 필요 시 간단한 crypto-js 대칭 암호화 (선택) |
| 시간 동기 | 클라이언트 Date.now | 오프라인 전제 |
| Stablecoin 시세 | 고정 모킹 값 | 예: 1 TOKEN = 1 USD (또는 static table) |

### 1.2 Stablecoin 시나리오 예시 (로컬 시뮬레이션)
1. 지갑 생성: 임의 walletId(UUID) & balance 초기값 (예: 1,000 TOKEN)
2. 전송(Transfer): 출발/도착 wallet 간 잔액 이동, 트랜잭션 로그 기록
3. 미션 배당(Mission Allocation): 특정 미션 코드에 예산 묶음 → 지급/소진 로깅
4. 보급 결제(Supply Purchase): 재고 감소 + wallet 차감 → 품목 로그
5. 감사 뷰(Audit): 모든 로그 필터/정렬 (메모리 + persisted copy)

각 도메인은 서버 검증이 없으므로 클라이언트 검증(잔액 부족, 음수 차감 방지)을 Zustand selector / action level에서 처리합니다.

## 2. 기술 스택 & 버전 힌트
| 기술 | 비고 / 목적 |
|------|--------------|
| Next.js 15 | App Router + RSC 기본 활성 |
| React 19 | `use` API 등 최신 특징 (실험적 기능은 선택 적용) |
| Tailwind CSS 4 | PostCSS 플러그인 v4 (@tailwindcss/postcss) 사용 |
| shadcn/ui | 재사용 가능 Headless + Styled 컴포넌트 추가 CLI |
| Zustand | 전역/모듈 상태, 비즈니스 로직 저장 |
| TypeScript 5 | 타입 안전성 |
| ESLint 9 | 코드 품질 |

> 참고: Tailwind v4 는 설정 방식/디렉토리 스캔이 v3 와 일부 다릅니다. shadcn/ui 문서가 Tailwind v3 기준일 수 있으니 필요 시 manual patch.

## 3. 현재 레포 상태 빠른 점검
- 이미 Next.js + TS + Tailwind 4 패키지 존재.
- `globals.css` 존재 (Tailwind 지시어(@tailwind) 포함 여부 확인 필요).
- 아직 shadcn 관련 디렉토리(`components/ui`, `lib/utils.ts`) 없음.
- Zustand 미설치.

## 4. 필수 패키지 설치
```bash
# 상태 & 유틸 & 아이콘
pnpm add zustand class-variance-authority clsx tailwind-merge lucide-react
# (선택) 간단 암호화 (민감도 매우 낮지만 데모 보호용)
# pnpm add crypto-js
# (주의) shadcn CLI 는 실행 시 일회성으로 npx/dlx 를 사용하는 경우가 일반적
# pnpm dlx (권장)
pnpm dlx shadcn@latest init
```

### 4.0 로컬 전용 데이터 정책
반드시 네트워크 호출이 없도록 lint 규칙 / 런타임 가드(옵션) 가능:
```ts
// lib/guard/no-network.ts
export function blockNetwork() {
  if (typeof window === 'undefined') return
  const deny = () => { throw new Error('Network calls are disabled in Commando POC') }
  ;(window as any).fetch = deny
  ;(XMLHttpRequest as any) = function() { deny() }
}
```
`app/layout.tsx` 클라이언트 boundary에서 opt-in 호출 (개발 중 실수 방지). 실제 프로덕션 전환 시 제거.

### 4.1 shadcn CLI 초기화
실행 중 질문(프롬프트) 예시:
- TypeScript? → yes
- Tailwind config 경로? → 기본(`tailwind.config.{js,ts}`) 또는 v4 자동 감지
- Components directory? → `components/ui`
- Aliases? → `@/components`, `@/lib`

생성 후:
```
components/
  ui/...
lib/
  utils.ts (className merge 헬퍼)
```

### 4.2 개별 컴포넌트 추가
```bash
# 버튼 예시
pnpm dlx shadcn@latest add button
# 여러 개 동시
pnpm dlx shadcn@latest add input form textarea dialog dropdown-menu
```

## 5. Tailwind CSS 4 관련 참고
Tailwind 4(가상) 구성은 보통 간소화된 preset 기반입니다. 필요 시 `tailwind.config.ts` (또는 `tailwind.config.js`)를 열고 다음과 같이 theme 확장:
```ts
// tailwind.config.ts (예시)
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: []
} satisfies Config
```

`globals.css` (또는 `app/globals.css`) 내 CSS 변수 & 기본 reset (shadcn 템플릿 참조) 추가:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --brand: 220 90% 55%;
  --brand-foreground: 210 40% 98%;
  --radius: 0.5rem;
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
body { @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))]; }
```

## 6. 디렉토리 구조 제안
```
app/
  (routes)/
  layout.tsx
  page.tsx
components/
  ui/ (shadcn CLI 생성)
  common/ (프로젝트 특화 조립 컴포넌트)
lib/
  utils.ts
  hooks/
    use-media-query.ts
state/
  auth.store.ts
  ui.store.ts
  ...도메인별 store
styles/
  (선택) tokens.css
```

## 7. Zustand 패턴
POC 성격상 모든 영속은 localStorage. 서버 상태에 의존하지 않으므로 optimistic / rollback 패턴은 단순화 가능합니다.

### 7.1 기본 Store
```ts
// state/ui.store.ts
'use client'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        sidebarOpen: false,
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen })
      }),
  { name: 'ui-store' }
    )
  )
)
```
> 주의: Server Component 에서는 직접 hook 호출 불가. 클라이언트 컴포넌트 분리 필요.

### 7.2 Server Component 연동 패턴
```tsx
// app/(dashboard)/page.tsx (Server Component 가능)
import SidebarClient from './_components/sidebar-client'

export default async function Page() {
  // 서버 로직, fetch, DB 등
  return (
    <div className="flex">
      <SidebarClient />
      <main className="flex-1 p-6">내용</main>
    </div>
  )
}
```
```tsx
// app/(dashboard)/_components/sidebar-client.tsx
'use client'
import { useUIStore } from '@/state/ui.store'
import { Button } from '@/components/ui/button'

export default function SidebarClient() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  return (
    <aside className={sidebarOpen ? 'w-64' : 'w-16'}>
      <Button variant="ghost" size="sm" onClick={toggleSidebar}>토글</Button>
    </aside>
  )
}
```

### 7.3 Store 분할 전략
- 도메인 단위 (`auth.store.ts`, `preferences.store.ts` 등) → 결합 감소.
- 교차 의존 최소화: 한 store 가 다른 store 직접 import 지양, 조합은 컴포넌트 레벨.
- 비즈니스 로직(파생 상태)은 selector 사용:
```ts
const isExpanded = useUIStore(s => s.sidebarOpen)
```

### 7.3.1 Stablecoin Wallet Store 예시
```ts
// state/wallet.store.ts
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

interface Txn {
  id: string
  type: 'transfer' | 'mission' | 'purchase'
  amount: number
  from?: string
  to?: string
  note?: string
  ts: number
}
interface WalletState {
  wallets: Record<string, { id: string; label: string; balance: number }>
  txns: Txn[]
  createWallet: (label: string, initial?: number) => string
  transfer: (from: string, to: string, amount: number, note?: string) => void
}

export const useWalletStore = create<WalletState>()(persist((set, get) => ({
  wallets: {},
  txns: [],
  createWallet: (label, initial = 1000) => {
    const id = nanoid(8)
    set(s => ({ wallets: { ...s.wallets, [id]: { id, label, balance: initial } } }))
    return id
  },
  transfer: (from, to, amount, note) => {
    if (amount <= 0) throw new Error('금액은 양수')
    const { wallets } = get()
    const src = wallets[from]; const dst = wallets[to]
    if (!src || !dst) throw new Error('지갑 없음')
    if (src.balance < amount) throw new Error('잔액 부족')
    set(s => ({
      wallets: {
        ...s.wallets,
        [from]: { ...src, balance: src.balance - amount },
        [to]: { ...dst, balance: dst.balance + amount }
      },
      txns: [
        { id: nanoid(10), type: 'transfer', amount, from, to, note, ts: Date.now() },
        ...s.txns
      ]
    }))
  }
}), { name: 'wallet-store' }))
```

> 선택: 프로덕션 전환 시 위 로직은 서버 서명/검증, 중복방지 nonce, 감사 trail externalization 필요.

### 7.4 SSR 환경 고려
- Zustand 자체는 서버에서 create 호출해도 되지만 **공유 싱글톤**은 서버 요청 간 상태 누수 위험 → 클라이언트 상태만 사용 또는 요청 스코프 팩토리 패턴.
- Auth / 세션 데이터는 RSC (server)에서 fetch 후 클라이언트 내려줄 최소 데이터만 store 초기화.

## 8. shadcn/ui 활용 전략
1. 디자인 토큰: 색/spacing은 CSS 변수 기반으로 설정 후 shadcn 컴포넌트 테마는 해당 변수 활용.
2. 컴포넌트 확장: 직접 수정 가능(복사 기반). upstream 업데이트 자동 merge 아님 → 변경 내역 주석.
3. 추상화 레이어:
   - `components/ui` : 원본 atomic
   - `components/common` : 조합 (ex. `AppSidebar`, `FormSection`)
4. 접근성: dialog, dropdown 등 Radix 기반 → aria 지원. 커스터마이징 시 role/aria-* 제거 주의.

### 8.1 variant 패턴 예시 (button 확장)
```ts
// components/ui/button.tsx (생성된 파일 상단/하단 확장)
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand/90',
        outline: 'border border-brand text-brand hover:bg-brand/10'
      },
      size: {
        sm: 'h-8 px-2',
        md: 'h-9 px-3',
        lg: 'h-11 px-5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)
```

## 9. ESLint & 품질
추가 추천:
```bash
pnpm add -D prettier eslint-config-prettier @tanstack/eslint-plugin-query @typescript-eslint/parser @typescript-eslint/eslint-plugin
```
`eslint.config.mjs` 예시 확장 (개략):
```js
import next from 'eslint-config-next'
import ts from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

export default [
  ...next,
  { languageOptions: { parser } },
  {
    rules: {
      'no-restricted-imports': [
        'error', { patterns: ['../*../*'] }
      ]
    }
  }
]
```

## 10. 추천 스크립트 (선택)
`package.json` 스크립트 예시:
```jsonc
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint . --ext ts,tsx --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "analyze": "ANALYZE=true next build"
  }
}
```

## 11. 퍼포먼스 & 구조 팁
- **RSC 우선**: 데이터 fetch 는 server component 에서, 인터랙션 있는 부분만 client.
- **Zustand 최소화**: 전역 공유 꼭 필요한 상태만 저장 (UI 토글, ephemeral form state는 local state 유지 권장).
- **코드 분리**: `export const runtime = 'edge'` (필요 시) 라우트별 성능 최적화.
- Icon은 `lucide-react` tree-shaking (필요 아이콘만 import).
 - **네트워크 호출 금지 모니터링**: 개발 중 console.warn patch, lint rule 사용.
 - **큰 로그(txns) 메모리 최적화**: 화면 뷰에 필요한 slice만 memo selector 사용.

## 12. 테스트 (추가 계획)
- Playwright (e2e), Vitest (유닛) 도입 검토.
- Zustand store: 로직있는 selector 는 함수 분리 → 순수 함수 테스트.

## 13. 접근성 (a11y)
- shadcn 기반 컴포넌트 유지: aria-label 제거 금지.
- 색 대비 체크: brand 색상 HSL 조정 WebAIM 대비 ≥ 4.5.

## 14. 배포 고려
- Vercel: Edge / Node runtime 구분. 이미지 최적화, 캐시 태그 사용.
- `.env` 안전: 서버 전용 변수 `NEXT_PUBLIC_` prefix 미포함.

## 15. 트러블슈팅
| 문제 | 원인 | 해결 |
|------|------|------|
| shadcn 컴포넌트 스타일 안 먹힘 | content 경로 누락 | `tailwind.config` content 경로 확인 |
| Zustand persist 안 됨 | name 충돌/localStorage 접근 실패 | 브라우저 devtools Application → storage 확인 |
| dark 모드 적용 안 됨 | `<html class="dark">` 미설정 | Layout에서 body/html class toggle 로직 추가 |
| 빌드 시 Radix 경고 | SSR + dynamic style sync | 최신 패키지 업데이트 / dynamic import 분리 |
| React 19 관련 경고 | 실험 API 사용 | 안정화된 API만 사용 or canary 문서 확인 |

## 16. 빠른 체크리스트
- [ ] `pnpm dlx shadcn@latest init` 실행
- [ ] 핵심 UI 컴포넌트 추가 (button, input, dialog...)
- [ ] `state/` 디렉토리 생성 및 store 작성
- [ ] Tailwind theme 확장 & CSS 변수 정의
- [ ] Dark mode toggle 구현
- [ ] ESLint + typecheck 스크립트 추가
- [ ] 첫 페이지에 shadcn 버튼 + Zustand 연동 예시 렌더
 - [ ] Wallet / Mission / Purchase demo store 추가
 - [ ] 네트워크 호출 차단 가드(optional) 적용
 - [ ] Stablecoin 고정 레이트 상수 정의

## 17. 첫 통합 예시 (page.tsx 수정)
```tsx
// app/page.tsx
import { Suspense } from 'react'
import HomeClient from './home-client'

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <HomeClient />
    </Suspense>
  )
}
```
```tsx
// app/home-client.tsx
'use client'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/state/ui.store'

export default function HomeClient() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Button onClick={toggleSidebar}>
        사이드바: {sidebarOpen ? '열림' : '닫힘'} (토글)
      </Button>
    </div>
  )
}
```

## 18. 다음 확장 아이디어
- Theme (라이트/다크/커스텀) 전환 컴포넌트
- Form handling + Zod + React Hook Form + shadcn `form` 컴포넌트
- Analytics & Feature flag store 분리
- i18n (next-intl) → locale 선택 상태 관리
 - Offline export/import (JSON) 기능 (지갑/로그 백업)
 - 간단 암호화(localStorage 암호화 wrapper)
 - PWA (오프라인 접근성 강화)

---
필요한 추가 항목이나 자동화(예: testing 설정)가 있다면 알려주세요. 즐거운 개발 되세요!

## 19. 병사 지갑 (Soldier Wallet) 모듈 사양

군 환경 시나리오 데모의 핵심 도메인인 "병사 지갑" 기능을 구조화한 개발 지침입니다. Stablecoin (Commando Coin) 과 원화(KRW) 자산, 급여/수당/지출/후급증(교통비 지원) 흐름을 로컬에서 시뮬레이션합니다.

### 19.1 기능 개요
1. 잔액 표시: Commando 코인(CCD 가칭) & KRW 동시 표시 (고정 환율 or 모킹 환율 테이블).
2. 입금 내역: 급여, 휴가비, 격오지/도서/항공 등 근무·출장 수당, 기타 포상금 로그.
3. 지출 내역: PX(매점) / 미션 구매 / 전송(transfer) / QR 결제 / 코인→KRW 전환.
4. 코인→KRW 전환: 수수료 정책(모킹) & 변환 트랜잭션 기록.
5. QR 결제: 지갑 간 P2P 혹은 상점 가상 merchantId 로 금액 전송.
6. 후급증(교통비 지원) 신청 & 상태 추적 (신청→발급→사용→폐기/미사용 파기).
7. 기본 통계: 월별 수입/지출 집계, 항목별(급여/수당/소비) 차트.
8. 데이터 Export/Import (선택): JSON 파일 로컬 백업.

### 19.2 화면 / 네비게이션 초안
| 화면 | 목적 | 주요 컴포넌트 |
|------|------|---------------|
| Wallet Dashboard (`/wallet`) | 요약 (잔액, 이번달 수입/지출) | BalanceCard, MonthlySummary, QuickActions |
| Transactions (`/wallet/tx`) | 모든 트랜잭션 필터/검색 | TxFilterBar, TxTable |
| Convert (`/wallet/convert`) | CCD→KRW 전환 | ConversionForm, RateInfo |
| QR Pay (`/wallet/qr`) | QR 생성 & 스캔 시뮬 | QRGenerator, QRScannerMock |
| Allowances (`/wallet/allowance`) | 급여/수당 내역 | AllowanceList, IncomeDetailDialog |
| Voucher (후급증) Center (`/wallet/voucher`) | 후급증 신청/발급/사용 | VoucherRequestForm, VoucherList, VoucherDetail |
| Settings (`/wallet/settings`) | 환율/수수료 mock 설정 | SettingsForm |

메인 페이지(Home) Quick Buttons: "잔액 보기", "QR 결제", "후급증 신청", "전환", "전체 내역".

### 19.3 데이터 모델 (초안)
```ts
// 통화 & 환율
interface RateState { base: 'CCD'; krwPerCCD: number; lastUpdated: number }

// 지갑 (단일 병사용, 다중 지갑 확장 용이)
interface WalletSnapshot { id: string; ccd: number; krw: number; updatedAt: number }

// 수입 타입 (급여/수당)
type IncomeKind = 'salary' | 'leaveAllowance' | 'remoteDuty' | 'islandDuty' | 'bonus' | 'other'

// 지출 타입
type ExpenseKind = 'px' | 'transfer' | 'qr' | 'conversion' | 'purchase' | 'other'

interface BaseTxn { id: string; ts: number; note?: string }
interface IncomeTxn extends BaseTxn { kind: 'income'; category: IncomeKind; amountCCD: number; amountKRW?: number }
interface ExpenseTxn extends BaseTxn { kind: 'expense'; category: ExpenseKind; amountCCD: number; counterparty?: string }
interface ConversionTxn extends BaseTxn { kind: 'conversion'; from: 'CCD'; to: 'KRW'; amountCCD: number; rate: number; feeCCD: number; receivedKRW: number }
interface QRPayTxn extends BaseTxn { kind: 'qr'; direction: 'send' | 'receive'; amountCCD: number; merchantId?: string; peerWalletId?: string }

// 후급증 (Voucher)
type VoucherTransport = 'bus' | 'air' | 'ship' | 'rail'
type VoucherStatus = 'requested' | 'approved' | 'printed' | 'used' | 'cancelled' | 'expired' | 'destroyed'
interface Voucher {
  id: string
  transport: VoucherTransport
  roundTrip: boolean
  origin: string
  destination: string
  departDate: string // ISO (yyyy-mm-dd)
  returnDate?: string
  status: VoucherStatus
  createdAt: number
  updatedAt: number
  immutablePrintHash?: string // printed 시점 hash (재발급 불가 시뮬)
  officerName?: string
  officerContact?: string
}

type AnyTxn = IncomeTxn | ExpenseTxn | ConversionTxn | QRPayTxn
```

### 19.4 Zustand Store 설계
스토어 분리 권장 (단일 거대 store 지양):
1. `rate.store.ts`: 환율 상태/수정 함수.
2. `wallet.store.ts`: 지갑 잔액 & balance mutation (입금/지출/전환 적용). 기존 예시 확장.
3. `txn.store.ts`: 트랜잭션 리스트 & 필터링 selector (페이지네이션 slice 지원).
4. `voucher.store.ts`: 후급증 CRUD & 상태 전이 (state machine 규칙 적용).
5. `settings.store.ts` (선택): 수수료율, 최대 전환 금액 등 Mock 정책.

예시 (후급증 상태 전이):
```ts
const allowedTransition: Record<VoucherStatus, VoucherStatus[]> = {
  requested: ['approved', 'cancelled'],
  approved: ['printed', 'cancelled'],
  printed: ['used', 'expired', 'destroyed'],
  used: [],
  cancelled: [],
  expired: ['destroyed'],
  destroyed: []
}
```
각 전이 시 `updatedAt` 및 감사 로그(txn 별도 아님, voucherLog optional) 추가.

### 19.5 후급증(Deferred Payment Certificate) 요약 & 규칙
설명 요약:
- 후급증은 휴가/출장 병사에게 제공되는 교통비 지원 공문서 (버스/항공/선박/철도 등). 특정 부대/휴가 유형에 따라 발급.
- 일부(예: 항공/선박)는 도서/격오지 근무 병사에게 빈번, 일반 육지 근무자는 제한적.
- 신청은 자동 혹은 개별 신청(최대 1주 절차) → 충분한 리드타임 권고.
- 인쇄 후 재발급/재인쇄 불가(단일 immutable). 분실 = 재발급 프로세스 필요 (PoC에서는 단순히 재신청 허용 or 블록 정책 선택).
- 문서에는 담당관 이름/연락처/도장(직인)이 필수. (PoC에서는 `officerName`, `officerContact` mock, `hasSeal: boolean`).
- 이용 날짜/구간(origin/destination & date) 수정 불가 (printed 이후 필드 lock → UI disable & hash).
- 미사용 문서는 파기(destroyed) 처리.
- 변형/위조 시 처벌 → PoC: 위조 방지를 위해 hash 비교 (수정 시 hash 달라짐 → warning 출력).

발급 플로우(시뮬):
1. Request: 사용자 입력(교통수단, 왕복 여부, 출발/복귀일, 목적지).
2. Approve: (자동) 규칙 검사 (출발일 ≥ 오늘+X일, 날짜 형식 유효 등).
3. Print: immutable hash 생성 (`sha256` of JSON subset) → status=printed.
4. Use: 사용 당일(또는 이후) 마킹 → status=used.
5. Expire: 출발일 경과+N일 & 미사용 → expired (배치 or 뷰 렌더시 계산).
6. Destroy: expired or printed 미사용 사용자가 파기.

검증 규칙 (간단):
- 출발일 < 오늘 → 신청 불가.
- 왕복일(returnDate) 존재 시 returnDate ≥ departDate.
- 동일 기간 중복 printed/approved voucher 타입 제한 (예: air 1건).
- printed 이후 수정 차단.

### 19.6 UX 세부
- Dashboard 상단: CCD / KRW 잔액 + 전환 버튼.
- 최근 5건 트랜잭션: 수입=녹색, 지출=빨강, 전환=보라, QR=노랑.
- 필터: 날짜 범위, 타입(수입/지출/전환/QR), 카테고리, 금액 min/max.
- 무한 스크롤 or 가상 리스트 (1000건 이상 시 렌더 최적화).
- 후급증 카드: 상태 배지 색상(status→색맵). printed 상태 hover 시 immutable 아이콘.
- QR 결제: 금액 입력→QR 코드 생성(데이터=JSON: {to, amount, ts, nonce}) → 스캔 시 가상 상점/상대 지갑으로 처리.

### 19.7 에러 & 엣지 케이스
- 잔액 부족 (transfer/qr/convert) → 토스트 + 버튼 disabled.
- 0 또는 음수 금액 → 즉시 Validation.
- 환율 0 또는 음수 → settings 보호 (기본 1.0, 허용 범위 0.5~2.0 예시).
- 후급증 중복 요청 (동일 날짜/목적지/수단) → 경고.
- localStorage 용량 초과 (대량 txn) → oldest txn drop 정책 (옵션) 또는 사용자 경고.

### 19.8 모킹 정책
- 급여/수당 자동 발생: 달의 1일에 salary, 특정 규칙(remoteDuty: 주 1회 등) simulated trigger (앱 로드 시 날짜 비교 후 누락분 생성).
- 환율: 기본 1 CCD = 1000 KRW (고정) 또는 settings store 조정.
- 전환 수수료: 1% (최소 1 CCD) - `feeCCD = Math.max(amount * 0.01, 1)`.

### 19.9 보안/무결성(로컬 기준)
- 모든 mutation 함수에서 음수 잔액 방지.
- 후급증 printed 해시: `sha256(id + departDate + origin + destination + officerName)` (라이브러리: `crypto-js` 선택적).
- QR payload nonce: `nanoid()` 사용 & 10분 초과시 만료.

### 19.10 최소 개발 단계 체크리스트
- [ ] `state/rate.store.ts` 생성 (기본 환율)
- [ ] `state/wallet.store.ts` 확장 (KRW + CCD 필드)
- [ ] `state/txn.store.ts` (필터 selector 포함)
- [ ] `state/voucher.store.ts` (전이 로직 + 검증)
- [ ] Dashboard UI (잔액/최근5건/QuickActions)
- [ ] 전환 화면 (수수료/결과 반영)
- [ ] 후급증 신청→승인→출력→사용 플로우
- [ ] QR 결제 시뮬 (생성/스캔 두 컴포넌트)
- [ ] 월별 통계 (그룹바/도넛 차트) - 라이브러리 or 간단 SVG
- [ ] Export/Import (선택) 구현

### 19.11 향후 확장 아이디어
- 다중 지갑 (예: 개인 / 임무 / 중대 공용) 탭 구조.
- 스마트 제한: 1일 QR 결제 한도, 고액 전환 추가 인증.
- 후급증 상태 자동 배치 스케줄러 (페이지 방문 없이 setInterval 기반 1회 실행).
- 감사 로그 별도 store (mutation trace: who/action/prev/next snapshot hash).

---
위 사양을 기반으로 구현을 진행하고, 필요 시 세부 스키마나 상태 전이 다이어그램을 추가하십시오.
