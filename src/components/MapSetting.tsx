import { useState } from "react";

import { useNaverMap } from "~/hooks/useNaverMap";

interface LocationSettingsProps {
	initialLat?: number;
	initialLng?: number;
	onLocationChange: (lat: number, lng: number) => void;
}

export default function MapSetting({
	initialLat = 37.5666103,
	initialLng = 126.9783882,
	onLocationChange,
}: LocationSettingsProps) {
	const [lat, setLat] = useState(initialLat);
	const [lng, setLng] = useState(initialLng);
	const handlePositionChange = (lat: number, lng: number) => {
		setLat(lat);
		setLng(lng);
		onLocationChange(lat, lng);
	};
	const { divRef, moveToPosition, getCurrentPosition } = useNaverMap({
		initialLat: lat,
		initialLng: lng,
		zoom: 15,
		onLocationChange: handlePositionChange,
	});

	// 초기 위치로 이동하는 함수
	const moveToOriginalPosition = () => {
		moveToPosition(initialLat, initialLng);
	};

	return (
		<div className="location-settings">
			{/* 좌표 정보 표시 */}
			<p style={{ fontSize: "12px", color: "#666" }}>
				지도를 클릭하거나 마커를 드래그하여 위치를 변경할 수 있습니다.
			</p>

			{/* 지도 컨테이너 */}
			<div style={{ position: "relative" }}>
				<div ref={divRef} style={{ width: "100%", height: "300px" }} />

				{/* 컨트롤 버튼들 */}
				<div
					style={{
						position: "absolute",
						top: "10px",
						right: "10px",
						display: "flex",
						flexDirection: "column",
						gap: "5px",
						zIndex: 1000,
					}}
				>
					<button
						type="button"
						onClick={getCurrentPosition}
						style={{
							padding: "8px 12px",
							backgroundColor: "#000",
							border: "1px solid #ccc",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "12px",
							fontWeight: "bold",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
						title="현재 위치로 이동"
					>
						📍 현재 위치
					</button>

					<button
						type="button"
						onClick={moveToOriginalPosition}
						style={{
							padding: "8px 12px",
							backgroundColor: "#000",
							border: "1px solid #ccc",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "12px",
							fontWeight: "bold",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
						title="초기 위치로 이동"
					>
						🏠 초기 위치
					</button>
				</div>
			</div>
		</div>
	);
}
