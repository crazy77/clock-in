import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

export default function NaverMap({ lat, lng }: { lat: number; lng: number }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  
  const initMap = useCallback(() => {
    if (!divRef.current || !window.naver?.maps) return;

    mapRef.current = new window.naver.maps.Map(divRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 15,
    });
    markerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map: mapRef.current,
    });
  }, [lat, lng]);

  const handleScriptLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // 원래 위치로 이동하는 함수
  const moveToOriginalPosition = useCallback(() => {
  if (!mapRef.current || !window.naver?.maps) return;
  const originalCenter = new window.naver.maps.LatLng(lat, lng);
  mapRef.current.panTo(originalCenter);
  mapRef.current.setZoom(15);
}, [lat, lng]);


  useEffect(() => {
    if (isLoaded) {
      initMap();
    }
  }, [isLoaded, initMap]);

  return (
    <div style={{ position: 'relative' }}>
      <Script
        src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=rroxtj31za"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <div ref={divRef} style={{ width: "100%", height: "400px" }} />
      
      {/* 원래 위치로 이동 버튼 */}
      <button
        onClick={moveToOriginalPosition}
        className="absolute top-2 right-2 z-10 p-2 border-zinc-300 border-3 cursor-pointer text-2xl rounded-full"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        🏠
      </button>
    </div>
  );
}
