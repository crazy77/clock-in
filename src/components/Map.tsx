import { useEffect } from "react";

import { useNaverMap } from "~/hooks/useNaverMap";

interface NaverMapProps {
	lat: number;
	lng: number;
}

export default function NaverMap({ lat, lng }: NaverMapProps) {
	const { divRef, moveToPosition } = useNaverMap({
		initialLat: lat,
		initialLng: lng,
		zoom: 15,
		isStatic: true,
	});

	// 원래 위치로 이동하는 함수
	const moveToOriginalPosition = () => {
		moveToPosition(lat, lng);
	};

	return (
		<div style={{ position: "relative" }}>
			<div ref={divRef} style={{ width: "100%", height: "200px" }} />

			{/* 원래 위치로 이동 버튼 */}
			<button
				type="button"
				onClick={moveToOriginalPosition}
				className="absolute top-2 right-2 z-10 cursor-pointer rounded-full border-3 border-zinc-300 p-2 text-2xl"
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = "#f5f5f5";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = "#fff";
				}}
			>
				🏠
			</button>
		</div>
	);
}
