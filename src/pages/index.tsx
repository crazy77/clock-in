import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

import dayjs from "dayjs";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import NaverMap from "~/components/Map";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
	type TranslationKey,
	getStatusTranslationKey,
	t,
	useTranslation,
} from "~/lib/i18n";
import { getCurrentLocation, isWithinWorkplace } from "~/lib/location";
import { api } from "~/utils/api";

export default function Home() {
	const { data: sessionData } = useSession();
	const { t, language } = useTranslation();
	const [currentTime, setCurrentTime] = useState(new Date());
	const [currentLocation, setCurrentLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { data: address } = api.attendance.getAddress.useQuery(
		{
			latitude: currentLocation?.latitude ?? 0,
			longitude: currentLocation?.longitude ?? 0,
		},
		{ enabled: !!currentLocation },
	);
	console.log("Log ~ Home ~ address:", address);

	// API 호출
	const { data: todayRecord, refetch: refetchTodayRecord } =
		api.attendance.getTodayRecord.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});
	const { data: workplaces } = api.attendance.getWorkplaces.useQuery(
		undefined,
		{ enabled: !!sessionData?.user },
	);

	// Date 객체들을 메모이제이션
	const clockInDate = useMemo(() => {
		return todayRecord?.clockInTime ? new Date(todayRecord.clockInTime) : null;
	}, [todayRecord?.clockInTime]);

	const clockOutDate = useMemo(() => {
		return todayRecord?.clockOutTime
			? new Date(todayRecord.clockOutTime)
			: null;
	}, [todayRecord?.clockOutTime]);

	// 근무 시간을 메모이제이션
	const workingHours = useMemo(() => {
		if (!clockInDate || !clockOutDate) {
			return "미체크";
		}
		const workTime = dayjs(clockOutDate).diff(dayjs(clockInDate), "minute");
		return `${Math.floor(workTime / 60)}시간 ${workTime % 60}분`;
	}, [clockInDate, clockOutDate]);

	// 토스트 메시지 함수들을 useCallback으로 메모이제이션
	const showClockInSuccess = useCallback(() => {
		toast.success(t("clockInSuccess"));
	}, [t]);

	const showClockOutSuccess = useCallback(() => {
		toast.success(t("clockOutSuccess"));
	}, [t]);

	const showError = useCallback(
		(message: string) => {
			if (message === "Already clocked in today") {
				toast.error(t("alreadyClockedIn"));
			} else if (message === "Today is a holiday") {
				toast.error(t("todayIsHoliday"));
			} else if (message === "Location out of range") {
				toast.error(t("locationError"));
			} else {
				toast.error(message);
			}
		},
		[t],
	);

	const showClockOutError = useCallback(
		(message: string) => {
			if (message === "Already clocked out today") {
				toast.error(t("alreadyClockedOut"));
			} else {
				toast.error(message);
			}
		},
		[t],
	);

	const showLocationError = useCallback(() => {
		toast.error(t("locationError"));
	}, [t]);

	const showGpsError = useCallback(() => {
		toast.error(t("gpsError"));
	}, [t]);

	const clockInMutation = api.attendance.clockIn.useMutation({
		onSuccess: () => {
			showClockInSuccess();
			refetchTodayRecord();
		},
		onError: (error) => {
			showError(error.message);
		},
	});

	const clockOutMutation = api.attendance.clockOut.useMutation({
		onSuccess: () => {
			showClockOutSuccess();
			refetchTodayRecord();
		},
		onError: (error) => {
			showClockOutError(error.message);
		},
	});

	// 현재 시간 업데이트
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// 현재 위치 가져오기 - sessionData?.user만 의존성으로 설정
	useEffect(() => {
		if (sessionData?.user) {
			getCurrentLocation()
				.then(setCurrentLocation)
				.catch((error) => {
					console.error("Failed to get location:", error);
					showGpsError();
				});
		}
	}, [sessionData?.user, showGpsError]);

	// 출근 처리
	const handleClockIn = async () => {
		if (!currentLocation || !workplaces || workplaces.length === 0) {
			showLocationError();
			return;
		}

		const workplace = workplaces[0]; // 첫 번째 출퇴근 장소 사용
		if (!workplace) {
			showLocationError();
			return;
		}

		if (
			!isWithinWorkplace(currentLocation, {
				id: workplace.id,
				name: workplace.name,
				latitude: Number.parseFloat(workplace.latitude),
				longitude: Number.parseFloat(workplace.longitude),
				radius: workplace.radius,
			})
		) {
			showLocationError();
			return;
		}

		setIsLoading(true);
		try {
			await clockInMutation.mutateAsync({
				workplaceId: workplace.id,
				latitude: currentLocation.latitude,
				longitude: currentLocation.longitude,
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 퇴근 처리
	const handleClockOut = async () => {
		if (!currentLocation || !workplaces || workplaces.length === 0) {
			showLocationError();
			return;
		}

		const workplace = workplaces[0]; // 첫 번째 출퇴근 장소 사용
		if (!workplace) {
			showLocationError();
			return;
		}

		if (
			!isWithinWorkplace(currentLocation, {
				id: workplace.id,
				name: workplace.name,
				latitude: Number.parseFloat(workplace.latitude),
				longitude: Number.parseFloat(workplace.longitude),
				radius: workplace.radius,
			})
		) {
			showLocationError();
			return;
		}

		setIsLoading(true);
		try {
			await clockOutMutation.mutateAsync({
				workplaceId: workplace.id,
				latitude: currentLocation.latitude,
				longitude: currentLocation.longitude,
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 로그인하지 않은 경우 로그인 화면 표시
	if (!sessionData?.user) {
		return (
			<>
				<Head>
					<title>{t("appName")}</title>
					<meta name="description" content="출퇴근 관리 시스템" />
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
					<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
						<div className="text-center">
							<h1 className="font-extrabold text-4xl text-gray-900 tracking-tight sm:text-6xl dark:text-white">
								{t("appName")}
							</h1>
							<p className="mt-4 text-gray-600 text-lg dark:text-gray-300">
								{t("welcome")}
							</p>
						</div>

						<Button
							size="lg"
							className="w-full font-bold text-base"
							onClick={() => {
								signIn("kakao");
							}}
							disabled={isLoading}
						>
							{t("signInWithKakao")}
						</Button>
					</div>
				</main>
			</>
		);
	}

	// 로그인한 경우 홈 화면 표시
	return (
		<>
			<Head>
				<title>{t("appName")}</title>
				<meta name="description" content="출퇴근 관리 시스템" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
				<div className="container mx-auto max-w-2xl space-y-4">
					{/* 헤더 */}
					<div className="flex items-center justify-between">
						<h1 className="font-bold text-2xl text-gray-900 dark:text-white">
							{t("appName")}
						</h1>
					</div>

					{/* 현재 시간 */}
					{/* <Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								{t("currentTime")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-center font-mono text-3xl">
								{format(currentTime, "HH:mm:ss", {
									locale: language === "ko" ? ko : enUS,
								})}
							</p>
							<p className="mt-2 text-center text-gray-600 text-sm dark:text-gray-300">
								{format(currentTime, "yyyy년 MM월 dd일 EEEE", {
									locale: language === "ko" ? ko : enUS,
								})}
							</p>
						</CardContent>
					</Card> */}

					{/* 현재 위치 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								{t("currentLocation")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<NaverMap
								lat={currentLocation?.latitude ?? 37.5665}
								lng={currentLocation?.longitude ?? 126.978}
							/>
							{currentLocation ? (
								<p className="font-mono text-sm">
									{currentLocation.latitude.toFixed(6)},{" "}
									{currentLocation.longitude.toFixed(6)}
									{address?.results?.[0]?.region?.area1?.name}
								</p>
							) : (
								<p className="text-gray-500 text-sm">{t("loading")}</p>
							)}
						</CardContent>
					</Card>

					{/* 출퇴근 버튼 */}
					<div className="grid grid-cols-2 gap-4">
						<Button
							onClick={handleClockIn}
							disabled={isLoading || !!todayRecord?.clockInTime}
							className="h-16 text-lg"
						>
							{t("clockIn")}
						</Button>
						<Button
							onClick={handleClockOut}
							disabled={
								isLoading ||
								!todayRecord?.clockInTime ||
								!!todayRecord?.clockOutTime
							}
							variant="outline"
							className="h-16 text-lg"
						>
							{t("clockOut")}
						</Button>
					</div>

					{/* 오늘 출퇴근 기록 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								{t("todayRecord")}
								{todayRecord?.status !== "normal" && (
									<div className="">
										<Badge
											variant={
												todayRecord?.status === "late"
													? "destructive"
													: "secondary"
											}
										>
											{getStatusBadge(todayRecord?.status ?? "normal")}
										</Badge>
									</div>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{todayRecord ? (
								<div className="space-y-3">
									{todayRecord.clockInTime && (
										<div className="flex items-center justify-between">
											<span className="text-gray-600 text-sm dark:text-gray-300">
												{t("clockInTime")}
											</span>
											<span className="font-mono">
												{clockInDate && format(clockInDate, "HH:mm:ss")}
											</span>
										</div>
									)}
									{todayRecord.clockOutTime && (
										<>
											<Separator />
											<div className="flex items-center justify-between">
												<span className="text-gray-600 text-sm dark:text-gray-300">
													{t("clockOutTime")}
												</span>
												<span className="font-mono">
													{clockOutDate && format(clockOutDate, "HH:mm:ss")}
												</span>
											</div>
											<Separator />
											<div className="flex items-center justify-between">
												<span className="text-gray-600 text-sm dark:text-gray-300">
													{t("workingHours")}
												</span>
												<span className="font-mono">{workingHours}</span>
											</div>
										</>
									)}
								</div>
							) : (
								<p className="text-center text-gray-500 text-sm">
									{t("noRecordToday")}
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</>
	);
}

export const getStatusBadge = (status: string) => {
	switch (status) {
		case "normal":
			return <Badge variant="default">{t("normal")}</Badge>;
		case "late":
			return <Badge variant="destructive">{t("late")}</Badge>;
		case "early_leave":
			return <Badge variant="secondary">{t("earlyLeave")}</Badge>;
		default:
			return (
				<Badge variant="outline">{t(getStatusTranslationKey(status))}</Badge>
			);
	}
};
