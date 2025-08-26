import { ReactNode } from 'react'
import { BottomBar } from '@/app/_components/bottom-bar'

export default function WalletSectionLayout({ children }: { children: ReactNode }) {
	// 조절 가능한 확대 배율 (필요시 1.0 ~ 1.3 사이로 조정)
		// 더 크게 확대 (이전 1.15 -> 1.3)
		const SCALE = 1.3
	return (
		<div className="w-full min-h-screen flex justify-center bg-[oklch(.18_.01_135)]/40 dark:bg-[oklch(.12_.01_135)]/60 p-4">
			{/* 래퍼: transform 으로 확대. layout shift 최소화를 위해 inline-block 사용 */}
			<div
				className="inline-block"
				style={{
					transform: `scale(${SCALE})`,
					transformOrigin: 'top center',
					// 확대 후 시각적 중심 정렬을 위해 (배율 - 1) 만큼의 여백 보정 (수직만 살짝)
					// 필요시 아래 marginTop 조정
					  // 확대 비율이 커지면 상단 잘림 방지를 위해 보정값을 조금 줄임
					  marginTop: `${(SCALE - 1) * -32}px`
				}}
			>
				<div
					className="relative w-full max-w-[420px] h-[844px] md:h-[900px] rounded-[2.4rem] border shadow-lg bg-background overflow-hidden flex flex-col"
					style={{ boxShadow: '0 4px 20px -2px oklch(0.2 0 0 / .5), 0 0 0 1px oklch(0.3 0 0 / .3)' }}
				>
					{/* Notch / status bar mock */}
					<div className="h-6 flex items-center justify-center relative">
						<div className="absolute top-1 left-1/2 -translate-x-1/2 w-40 h-5 bg-black/60 dark:bg-black/80 rounded-full" />
					</div>
					{/* Scrollable content */}
					<div className="flex-1 overflow-y-auto pb-20">{children}</div>
					<div className="absolute bottom-0 left-0 right-0">
						<BottomBar />
					</div>
				</div>
			</div>
		</div>
	)
}
