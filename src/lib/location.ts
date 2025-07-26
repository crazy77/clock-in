export interface Location {
	latitude: number;
	longitude: number;
}

export interface Workplace {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
	radius: number; // 미터 단위
}

/**
 * 두 지점 간의 거리를 계산합니다 (미터 단위)
 */
export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371e3; // 지구의 반지름 (미터)
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

/**
 * 현재 위치가 출퇴근 장소 범위 내에 있는지 확인합니다
 */
export function isWithinWorkplace(
	currentLocation: Location,
	workplace: Workplace,
): boolean {
	const distance = calculateDistance(
		currentLocation.latitude,
		currentLocation.longitude,
		workplace.latitude,
		workplace.longitude,
	);
	return distance <= workplace.radius;
}

/**
 * 브라우저의 위치 정보를 가져옵니다
 */
export function getCurrentLocation(): Promise<Location> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation is not supported by this browser"));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			(error) => {
				reject(error);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000,
			},
		);
	});
}

/**
 * 위치 정보를 문자열로 포맷팅합니다
 */
export function formatLocation(location: Location): string {
	return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}
