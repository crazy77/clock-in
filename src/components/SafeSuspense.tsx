import type { ClassValue } from "clsx";
import type React from "react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { cn } from "~/lib/utils";

// 프리셋 정의 (테일윈드 className 문자열)
export const SKELETON_PRESETS = {
	card: "h-[120px] bg-gray-200 rounded-xl mb-4 animate-pulse",
	list: "h-[60px] bg-gray-200 rounded-lg mb-3 animate-pulse",
	table: "h-[48px] bg-gray-100 rounded mb-2 animate-pulse",
	banner: "h-[200px] bg-gray-200 rounded-2xl mb-0 animate-pulse",
} as const;

// 타입 정의
type SkeletonPresetName = keyof typeof SKELETON_PRESETS;

interface SafeSuspenseProps {
	children: React.ReactNode;
	loadingFallback?: React.ReactNode;
	skeleton?:
		| {
				count?: number;
				className?: ClassValue; // 🎯 ClassValue로 모든 형태 지원
		  }
		| boolean
		| SkeletonPresetName;
	errorFallback?: React.ReactNode;
}

// 스켈레톤 생성 컴포넌트
const SkeletonLoader: React.FC<{ count: number; className: string }> = ({
	count,
	className,
}) => {
	return (
		<div className="p-5">
			{Array.from({ length: count }, (_, i) => i + 1).map((num) => (
				<div key={num} className={className} />
			))}
		</div>
	);
};

// 기본 로딩 UI
const DefaultLoadingFallback = () => (
	<div className="p-5 text-center text-gray-500">
		<div>🌀 로딩 중...</div>
	</div>
);

// 기본 에러 UI (메시지 + 리셋 버튼)
const DefaultErrorFallback: React.FC<FallbackProps> = ({
	error,
	resetErrorBoundary,
}) => (
	<div className="m-5 rounded-lg border border-red-400 bg-red-100 p-5 text-center">
		<h3 className="mb-2 font-semibold text-lg text-red-700">
			⚠️ 오류가 발생했습니다
		</h3>
		<p className="my-2 text-gray-600 text-sm">{error.message}</p>
		<button
			type="button"
			onClick={resetErrorBoundary}
			className="cursor-pointer rounded bg-red-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-red-500"
		>
			다시 시도
		</button>
	</div>
);

// SafeSuspense 메인 컴포넌트
export const SafeSuspense: React.FC<SafeSuspenseProps> = ({
	children,
	loadingFallback,
	skeleton,
	errorFallback,
}) => {
	const getLoadingFallback = () => {
		// 1. 커스텀 loadingFallback이 있으면 우선 사용
		if (loadingFallback) return loadingFallback;

		// 2. skeleton 설정이 없으면 기본 로딩 UI
		if (!skeleton) return <DefaultLoadingFallback />;

		// 3. skeleton이 true면 기본 프리셋(card) 사용
		if (skeleton === true) {
			return <SkeletonLoader count={3} className={SKELETON_PRESETS.card} />;
		}

		// 4. skeleton이 문자열이면 프리셋 사용
		if (typeof skeleton === "string") {
			return (
				<SkeletonLoader count={3} className={SKELETON_PRESETS[skeleton]} />
			);
		}

		// 5. skeleton이 객체면 커스텀 설정 사용
		const { count = 3, className = SKELETON_PRESETS.card } = skeleton;
		const finalClassName =
			typeof className === "string" ? className : cn(className); // ClassValue를 문자열로 변환

		return <SkeletonLoader count={count} className={finalClassName} />;
	};

	return (
		<ErrorBoundary
			FallbackComponent={
				errorFallback ? () => errorFallback : DefaultErrorFallback
			}
		>
			<Suspense fallback={getLoadingFallback()}>{children}</Suspense>
		</ErrorBoundary>
	);
};
