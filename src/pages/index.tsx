import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";

import { Calendar, Clock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useTranslation } from "~/lib/i18n";
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

	// API 호출
	const { data: todayRecord, refetch: refetchTodayRecord } =
		api.attendance.getTodayRecord.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});
	const { data: workplaces } = api.attendance.getWorkplaces.useQuery(
		undefined,
		{ enabled: !!sessionData?.user },
	);

	const clockInMutation = api.attendance.clockIn.useMutation({
		onSuccess: () => {
			toast.success(t("clockInSuccess"));
			refetchTodayRecord();
		},
		onError: (error) => {
			if (error.message === "Already clocked in today") {
				toast.error(t("alreadyClockedIn"));
			} else if (error.message === "Today is a holiday") {
				toast.error(t("todayIsHoliday"));
			} else if (error.message === "Location out of range") {
				toast.error(t("locationError"));
			} else {
				toast.error(error.message);
			}
		},
	});

	const clockOutMutation = api.attendance.clockOut.useMutation({
		onSuccess: () => {
			toast.success(t("clockOutSuccess"));
			refetchTodayRecord();
		},
		onError: (error) => {
			if (error.message === "Already clocked out today") {
				toast.error(t("alreadyClockedOut"));
			} else {
				toast.error(error.message);
			}
		},
	});

	// 현재 시간 업데이트
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// 현재 위치 가져오기
	useEffect(() => {
		if (sessionData?.user) {
			getCurrentLocation()
				.then(setCurrentLocation)
				.catch((error) => {
					console.error("Failed to get location:", error);
					toast.error(t("gpsError"));
				});
		}
	}, [sessionData?.user, t]);

	// 출근 처리
	const handleClockIn = async () => {
		if (!currentLocation || !workplaces || workplaces.length === 0) {
			toast.error(t("locationError"));
			return;
		}

		const workplace = workplaces[0]; // 첫 번째 출퇴근 장소 사용
		if (!workplace) {
			toast.error(t("locationError"));
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
			toast.error(t("locationError"));
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
			toast.error(t("locationError"));
			return;
		}

		const workplace = workplaces[0]; // 첫 번째 출퇴근 장소 사용
		if (!workplace) {
			toast.error(t("locationError"));
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
			toast.error(t("locationError"));
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

						<Card className="w-full max-w-md">
							<CardHeader className="text-center">
								<CardTitle className="text-2xl">{t("login")}</CardTitle>
							</CardHeader>
							<CardContent>
								<Button
									className="w-full"
									onClick={() => {
										window.location.href = "/api/auth/signin";
									}}
									disabled={isLoading}
								>
									{t("signInWithKakao")}
								</Button>
							</CardContent>
						</Card>
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
				<div className="container mx-auto max-w-2xl space-y-6">
					{/* 헤더 */}
					<div className="flex items-center justify-between">
						<h1 className="font-bold text-2xl text-gray-900 dark:text-white">
							{t("appName")}
						</h1>
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
							<span className="text-gray-600 text-sm dark:text-gray-300">
								{sessionData.user.name}
							</span>
						</div>
					</div>

					{/* 현재 시간 */}
					<Card>
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
					</Card>

					{/* 현재 위치 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								{t("currentLocation")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{currentLocation ? (
								<p className="font-mono text-sm">
									{currentLocation.latitude.toFixed(6)},{" "}
									{currentLocation.longitude.toFixed(6)}
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
												{format(new Date(todayRecord.clockInTime), "HH:mm:ss")}
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
													{format(
														new Date(todayRecord.clockOutTime),
														"HH:mm:ss",
													)}
												</span>
											</div>
											<Separator />
											<div className="flex items-center justify-between">
												<span className="text-gray-600 text-sm dark:text-gray-300">
													{t("workingHours")}
												</span>
												<span className="font-mono">
													{format(
														new Date(todayRecord.clockOutTime).getTime() -
															new Date(todayRecord.clockInTime || "").getTime(),
														"HH:mm",
														{ locale: language === "ko" ? ko : enUS },
													)}
												</span>
											</div>
										</>
									)}
									{todayRecord.status !== "normal" && (
										<div className="mt-3">
											<Badge
												variant={
													todayRecord.status === "late"
														? "destructive"
														: "secondary"
												}
											>
												{t(
													todayRecord.status === "early_leave"
														? "earlyLeave"
														: todayRecord.status,
												)}
											</Badge>
										</div>
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
