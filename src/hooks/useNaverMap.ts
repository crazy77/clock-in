import { useCallback, useEffect, useRef, useState } from "react";

interface UseNaverMapOptions {
	initialLat: number;
	initialLng: number;
	zoom?: number;
	isStatic?: boolean;
	onLocationChange?: (lat: number, lng: number) => void;
}

interface UseNaverMapReturn {
	divRef: React.RefObject<HTMLDivElement | null>;
	isLoaded: boolean;
	initMap: () => void;
	destroyMap: () => void;
	moveToPosition: (lat: number, lng: number) => void;
	getCurrentPosition: () => void;
}

// 전역 네이버 지도 스크립트 로딩 상태 관리
let scriptLoaded = false;
let scriptLoading = false;
const scriptLoadCallbacks: (() => void)[] = [];

const loadNaverMapScript = (): Promise<void> => {
	return new Promise((resolve) => {
		if (scriptLoaded) {
			resolve();
			return;
		}

		if (scriptLoading) {
			scriptLoadCallbacks.push(resolve);
			return;
		}

		scriptLoading = true;

		// 이미 스크립트가 있는지 확인
		if (window.naver?.maps) {
			scriptLoaded = true;
			scriptLoading = false;
			resolve();
			return;
		}

		// 스크립트 동적 로딩
		const script = document.createElement("script");
		script.src =
			"https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=rroxtj31za&submodules=geocoder";
		script.async = true;
		script.onload = () => {
			scriptLoaded = true;
			scriptLoading = false;
			resolve();
			// 대기 중인 콜백들 실행
			for (const callback of scriptLoadCallbacks) {
				callback();
			}
			scriptLoadCallbacks.length = 0;
		};
		script.onerror = () => {
			scriptLoading = false;
			console.error("네이버 지도 스크립트 로딩 실패");
		};
		document.head.appendChild(script);
	});
};

export function useNaverMap({
	initialLat,
	initialLng,
	zoom = 15,
	isStatic = false,
	onLocationChange,
}: UseNaverMapOptions): UseNaverMapReturn {
	const divRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<naver.maps.Map | null>(null);
	const markerRef = useRef<naver.maps.Marker | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const eventListenersRef = useRef<naver.maps.MapEventListener[]>([]);

	const destroyMap = useCallback(() => {
		// 이벤트 리스너 제거
		if (mapRef.current && markerRef.current) {
			eventListenersRef.current = [];
		}

		// 마커 제거
		if (markerRef.current) {
			markerRef.current.setMap(null);
			markerRef.current = null;
		}

		// 지도 제거
		if (mapRef.current) {
			mapRef.current.destroy();
			mapRef.current = null;
		}
	}, []);

	const initMap = useCallback(async () => {
		if (!divRef.current) return;

		try {
			await loadNaverMapScript();

			if (!window.naver?.maps) {
				console.error("네이버 지도 API를 사용할 수 없습니다.");
				return;
			}

			// 기존 지도 정리
			destroyMap();

			// 새 지도 생성
			mapRef.current = new window.naver.maps.Map(divRef.current, {
				center: new window.naver.maps.LatLng(initialLat, initialLng),
				zoom,
				zoomControl: true,
			});

			// 마커 생성
			markerRef.current = new window.naver.maps.Marker({
				position: new window.naver.maps.LatLng(initialLat, initialLng),
				map: mapRef.current,
				draggable: true,
			});

			// 지도 클릭 이벤트
			const mapClickListener = (e: naver.maps.PointerEvent) => {
				const clickedLatLng = e.coord as naver.maps.LatLng;
				console.log("Log ~ mapClickListener ~ clickedLatLng:", clickedLatLng);
				const lat = clickedLatLng.lat();
				const lng = clickedLatLng.lng();

				markerRef.current?.setPosition(clickedLatLng);
				try {
					naver.maps.Service?.reverseGeocode(
						{ coords: clickedLatLng },
						(status, response) => {
							console.log("Log ~ mapClickListener ~ response:", response);
							console.log("Log ~ mapClickListener ~ status:", status);
							if (status !== naver.maps.Service.Status.OK) {
								return console.error("주소를 찾을 수 없습니다!");
							}

							const result = response.v2;
							const address = result.address.jibunAddress; // 지번 주소
							const roadAddress = result.address.roadAddress; // 도로명 주소

							console.log("지번 주소:", address);
							console.log("도로명 주소:", roadAddress);

							// 결과 활용
							console.log(`클릭한 위치의 주소: ${address}`);
						},
					);
				} catch (error) {
					console.log("Log ~ mapClickListener ~ error:", error);
				}

				onLocationChange?.(lat, lng);
			};

			// 마커 드래그 이벤트
			const markerDragListener = () => {
				if (!markerRef.current) return;

				const position = markerRef.current.getPosition();
				const lat = (position as naver.maps.LatLng).lat();
				const lng = (position as naver.maps.LatLng).lng();

				onLocationChange?.(lat, lng);
			};

			// 이벤트 리스너 등록 및 참조 저장
			if (!isStatic) {
				eventListenersRef.current = [
					window.naver.maps.Event.addListener(
						mapRef.current,
						"click",
						mapClickListener,
					),
					window.naver.maps.Event.addListener(
						markerRef.current,
						"dragend",
						markerDragListener,
					),
				];
			}

			setIsLoaded(true);
		} catch (error) {
			console.error("지도 초기화 실패:", error);
		}
	}, [initialLat, initialLng, zoom, onLocationChange, destroyMap, isStatic]);

	const moveToPosition = useCallback(
		(lat: number, lng: number) => {
			if (!mapRef.current || !markerRef.current || !window.naver?.maps) return;

			const position = new window.naver.maps.LatLng(lat, lng);
			mapRef.current.morph(position);
			markerRef.current?.setPosition(position);
			onLocationChange?.(lat, lng);
		},
		[onLocationChange],
	);

	const getCurrentPosition = useCallback(() => {
		if (!navigator.geolocation) {
			alert("위치 서비스가 지원되지 않습니다.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				moveToPosition(lat, lng);
			},
			(error) => {
				console.error("위치를 가져올 수 없습니다:", error);
				alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
			},
		);
	}, [moveToPosition]);

	// 컴포넌트 마운트 시 지도 초기화
	useEffect(() => {
		initMap();

		// 컴포넌트 언마운트 시 정리
		return () => {
			destroyMap();
		};
	}, [initMap, destroyMap]);

	return {
		divRef,
		isLoaded,
		initMap,
		destroyMap,
		moveToPosition,
		getCurrentPosition,
	};
}
