import Script from "next/script";
import { type RefObject, useCallback, useRef } from "react";

export default function NaverMap({ lat, lng }: { lat: number; lng: number }) {
	const mapRef = useRef<naver.maps.Map | null>(null);

	const initMap = useCallback(() => {
		mapRef.current = new window.naver.maps.Map("naver-map", {
			center: new window.naver.maps.LatLng(lat, lng),
			zoom: 15,
		});
	}, [lat, lng]);

	return (
		<>
			<Script
				src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=rroxtj31za"
				onLoad={initMap}
			/>
			<div id="naver-map" style={{ width: "100%", height: "400px" }} />
		</>
	);
}
