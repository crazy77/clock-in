import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart as RechartsPieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	Activity,
	BarChart3,
	Calendar,
	Clock,
	PieChart,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";

export default function StatisticsPage() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const [selectedMonth, setSelectedMonth] = useState(
		format(new Date(), "yyyy-MM"),
	);

	// 월별 기록 데이터
	const [selectedYear, selectedMonthNum] = selectedMonth.split("-").map(Number);
	const { data: monthlyData, isLoading } =
		api.attendance.getPersonalMonthlyRecords.useQuery(
			{
				year: selectedYear || new Date().getFullYear(),
				month: selectedMonthNum || new Date().getMonth() + 1,
			},
			{
				enabled: !!sessionData?.user,
			},
		);

	const allRecords = monthlyData ?? [];

	// 선택된 월의 데이터 (이미 필터링됨)
	const selectedMonthData = allRecords;

	// 통계 계산
	const stats = useMemo(() => {
		const totalDays = selectedMonthData.length;
		const normalDays = selectedMonthData.filter(
			(r) => r.status === "normal",
		).length;
		const lateDays = selectedMonthData.filter(
			(r) => r.status === "late",
		).length;
		const earlyLeaveDays = selectedMonthData.filter(
			(r) => r.status === "early_leave",
		).length;
		const absentDays = 0; // 결근일 계산 로직 필요

		const averageClockInTime =
			selectedMonthData
				.filter((r) => r.clockInTime)
				.reduce((acc, record) => {
					const time = new Date(record.clockInTime!);
					return acc + time.getHours() * 60 + time.getMinutes();
				}, 0) / selectedMonthData.filter((r) => r.clockInTime).length || 0;

		const averageClockOutTime =
			selectedMonthData
				.filter((r) => r.clockOutTime)
				.reduce((acc, record) => {
					const time = new Date(record.clockOutTime!);
					return acc + time.getHours() * 60 + time.getMinutes();
				}, 0) / selectedMonthData.filter((r) => r.clockOutTime).length || 0;

		return {
			totalDays,
			normalDays,
			lateDays,
			earlyLeaveDays,
			absentDays,
			averageClockInTime: Math.round(averageClockInTime),
			averageClockOutTime: Math.round(averageClockOutTime),
			attendanceRate:
				totalDays > 0
					? ((normalDays + lateDays + earlyLeaveDays) / totalDays) * 100
					: 0,
		};
	}, [selectedMonthData]);

	// 차트 데이터 준비
	const chartData = useMemo(() => {
		// 출근 상태 분포
		const statusData = [
			{ name: t("normal"), value: stats.normalDays, color: "#10b981" },
			{ name: t("late"), value: stats.lateDays, color: "#ef4444" },
			{ name: t("earlyLeave"), value: stats.earlyLeaveDays, color: "#f59e0b" },
			{ name: t("absent"), value: stats.absentDays, color: "#6b7280" },
		].filter((item) => item.value > 0);

		// 일별 출근 시간 차트
		const dailyData = selectedMonthData
			.filter((r) => r.clockInTime)
			.map((record) => {
				const clockInTime = new Date(record.clockInTime!);
				const hours = clockInTime.getHours();
				const minutes = clockInTime.getMinutes();
				const timeInMinutes = hours * 60 + minutes;

				return {
					date: format(new Date(record.date), "MM/dd"),
					clockIn: timeInMinutes,
					status: record.status,
				};
			})
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		return { statusData, dailyData };
	}, [selectedMonthData, stats, t]);

	// 월별 옵션 생성 (최근 12개월)
	const monthOptions = useMemo(() => {
		const options = [];
		const currentDate = new Date();

		for (let i = 0; i < 12; i++) {
			const date = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - i,
				1,
			);
			options.push({
				value: format(date, "yyyy-MM"),
				label: format(date, "yyyy년 MM월", { locale: ko }),
			});
		}

		return options;
	}, []);

	const formatTime = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "normal":
				return <Badge variant="default">{t("normal")}</Badge>;
			case "late":
				return <Badge variant="destructive">{t("late")}</Badge>;
			case "early_leave":
				return <Badge variant="secondary">{t("earlyLeave")}</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex h-64 items-center justify-center">
					<div className="text-lg">{t("loading")}</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{t("statistics")} - Clock In</title>
			</Head>

			<div className="container mx-auto p-4">
				<div className="mb-6">
					<h1 className="mb-2 font-bold text-3xl">{t("statistics")}</h1>
					<p className="text-muted-foreground">{t("statisticsDescription")}</p>
				</div>

				{/* 월 선택 */}
				<div className="mb-6">
					<Select value={selectedMonth} onValueChange={setSelectedMonth}>
						<SelectTrigger className="w-[200px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{monthOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 통계 카드 */}
				<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Calendar className="h-4 w-4 text-blue-600" />
								<span className="font-medium text-sm">
									{t("totalWorkDays")}
								</span>
							</div>
							<p className="font-bold text-2xl">{stats.totalDays}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<TrendingUp className="h-4 w-4 text-green-600" />
								<span className="font-medium text-sm">
									{t("attendanceRate")}
								</span>
							</div>
							<p className="font-bold text-2xl">
								{stats.attendanceRate.toFixed(1)}%
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-orange-600" />
								<span className="font-medium text-sm">
									{t("averageClockIn")}
								</span>
							</div>
							<p className="font-bold text-2xl">
								{stats.averageClockInTime > 0
									? formatTime(stats.averageClockInTime)
									: "-"}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-red-600" />
								<span className="font-medium text-sm">
									{t("averageClockOut")}
								</span>
							</div>
							<p className="font-bold text-2xl">
								{stats.averageClockOutTime > 0
									? formatTime(stats.averageClockOutTime)
									: "-"}
							</p>
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="overview" className="space-y-4">
					<TabsList>
						<TabsTrigger value="overview">{t("overview")}</TabsTrigger>
						<TabsTrigger value="details">{t("details")}</TabsTrigger>
						<TabsTrigger value="charts">{t("charts")}</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-4">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center space-x-2">
										<Activity className="h-5 w-5" />
										<span>{t("attendanceStatus")}</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span>{t("normal")}</span>
											<div className="flex items-center space-x-2">
												<span className="font-semibold">
													{stats.normalDays}
												</span>
												<Badge variant="default">{t("normal")}</Badge>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span>{t("late")}</span>
											<div className="flex items-center space-x-2">
												<span className="font-semibold">{stats.lateDays}</span>
												<Badge variant="destructive">{t("late")}</Badge>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span>{t("earlyLeave")}</span>
											<div className="flex items-center space-x-2">
												<span className="font-semibold">
													{stats.earlyLeaveDays}
												</span>
												<Badge variant="secondary">{t("earlyLeave")}</Badge>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center space-x-2">
										<Clock className="h-5 w-5" />
										<span>{t("timeAnalysis")}</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span>{t("averageClockIn")}</span>
											<span className="font-semibold">
												{stats.averageClockInTime > 0
													? formatTime(stats.averageClockInTime)
													: "-"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span>{t("averageClockOut")}</span>
											<span className="font-semibold">
												{stats.averageClockOutTime > 0
													? formatTime(stats.averageClockOutTime)
													: "-"}
											</span>
										</div>
										<Separator />
										<div className="flex items-center justify-between">
											<span>{t("attendanceRate")}</span>
											<span className="font-semibold">
												{stats.attendanceRate.toFixed(1)}%
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="details" className="space-y-4">
						<div className="space-y-4">
							{selectedMonthData.length === 0 ? (
								<Card>
									<CardContent className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="text-muted-foreground">
												{t("noDataForMonth")}
											</p>
										</div>
									</CardContent>
								</Card>
							) : (
								selectedMonthData.map((record) => (
									<Card key={record.id}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<Calendar className="h-5 w-5" />
													<span className="font-semibold">
														{format(new Date(record.date), "MM월 dd일 (E)", {
															locale: ko,
														})}
													</span>
												</div>
												{getStatusBadge(record.status)}
											</div>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<div className="space-y-3">
													<div className="flex items-center space-x-2">
														<TrendingUp className="h-4 w-4 text-green-600" />
														<span className="font-medium">{t("clockIn")}</span>
														<span className="text-muted-foreground text-sm">
															{record.clockInTime
																? format(
																		new Date(record.clockInTime),
																		"HH:mm:ss",
																		{ locale: ko },
																	)
																: "-"}
														</span>
													</div>
												</div>

												<div className="space-y-3">
													<div className="flex items-center space-x-2">
														<TrendingDown className="h-4 w-4 text-red-600" />
														<span className="font-medium">{t("clockOut")}</span>
														<span className="text-muted-foreground text-sm">
															{record.clockOutTime
																? format(
																		new Date(record.clockOutTime),
																		"HH:mm:ss",
																		{ locale: ko },
																	)
																: "-"}
														</span>
													</div>
												</div>
											</div>

											{record.workplace && (
												<>
													<Separator className="my-4" />
													<div className="flex items-center space-x-2 text-muted-foreground text-sm">
														<span>{record.workplace.name}</span>
													</div>
												</>
											)}
										</CardContent>
									</Card>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="charts" className="space-y-6">
						{selectedMonthData.length === 0 ? (
							<Card>
								<CardContent className="flex h-64 items-center justify-center">
									<div className="text-center">
										<BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
										<p className="text-muted-foreground">
											{t("noDataForMonth")}
										</p>
									</div>
								</CardContent>
							</Card>
						) : (
							<>
								{/* 출근 상태 분포 차트 */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<PieChart className="h-5 w-5" />
											<span>{t("attendanceDistribution")}</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<RechartsPieChart>
												<Pie
													data={chartData.statusData}
													cx="50%"
													cy="50%"
													labelLine={false}
													label={({ name, percent }) =>
														`${name} ${(percent * 100).toFixed(0)}%`
													}
													outerRadius={80}
													fill="#8884d8"
													dataKey="value"
												>
													{chartData.statusData.map((entry, index) => (
														<Cell key={`cell-${index}`} fill={entry.color} />
													))}
												</Pie>
												<Tooltip />
											</RechartsPieChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>

								{/* 일별 출근 시간 차트 */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<BarChart3 className="h-5 w-5" />
											<span>{t("timeTrend")}</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<BarChart data={chartData.dailyData}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="date" />
												<YAxis
													tickFormatter={(value) => formatTime(value)}
													domain={[8 * 60, 10 * 60]} // 8시~10시 범위
												/>
												<Tooltip
													formatter={(value: number) => [
														formatTime(value),
														t("clockIn"),
													]}
													labelFormatter={(label) => `${label} ${t("clockIn")}`}
												/>
												<Bar dataKey="clockIn" fill="#10b981" />
											</BarChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>
							</>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
