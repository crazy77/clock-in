import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
	Building,
	Calendar,
	Clock,
	Download,
	Edit,
	Filter,
	MapPin,
	Plus,
	Settings,
	Trash2,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "~/components/ui/AdminGuard";
import { DatePicker } from "~/components/ui/DatePicker";
import { TimePicker } from "~/components/ui/TimePicker";
import { UserTimeCard } from "~/components/ui/UserTimeCard";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { useTranslation } from "~/lib/i18n";
import type { TranslationKey } from "~/lib/i18n";
import { type RouterOutputs, api } from "~/utils/api";

type Workplaces = RouterOutputs["attendance"]["getWorkplaces"];
type Holidays = RouterOutputs["attendance"]["getHolidays"];

export default function AdminPage() {
	return (
		<AdminGuard>
			<AdminPageContent />
		</AdminGuard>
	);
}

function AdminPageContent() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const [filterLateEarly, setFilterLateEarly] = useState(true);
	const [isWorkplaceDialogOpen, setIsWorkplaceDialogOpen] = useState(false);
	const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
	const [editingWorkplace, setEditingWorkplace] = useState<
		Workplaces[number] | null
	>(null);
	const [editingHoliday, setEditingHoliday] = useState<Holidays[number] | null>(
		null,
	);
	const [holidayType, setHolidayType] = useState<"weekly" | "specific_date">(
		"specific_date",
	);
	const [defaultClockInTime, setDefaultClockInTime] = useState("09:00");
	const [defaultClockOutTime, setDefaultClockOutTime] = useState("18:00");

	// 오늘 출퇴근 상황
	const { data: todayStatus, isLoading: todayLoading } =
		api.attendance.getTodayStatus.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});

	// 월별 기록
	const {
		data: monthlyData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: monthlyLoading,
	} = api.attendance.getMonthlyRecords.useInfiniteQuery(
		{
			filterLateEarly,
			limit: 20,
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			enabled: !!sessionData?.user,
		},
	);

	// 출퇴근 장소 목록
	const { data: workplaces, refetch: refetchWorkplaces } =
		api.attendance.getWorkplaces.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});

	// 출퇴근 장소 추가/수정/삭제 뮤테이션
	const createWorkplaceMutation = api.attendance.createWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
			setIsWorkplaceDialogOpen(false);
		},
	});

	const updateWorkplaceMutation = api.attendance.updateWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
			setIsWorkplaceDialogOpen(false);
			setEditingWorkplace(null);
		},
	});

	const deleteWorkplaceMutation = api.attendance.deleteWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
		},
	});

	// 기본 출퇴근 시간 조회
	const {
		data: defaultTimes,
		refetch: refetchDefaultTimes,
		isLoading,
	} = api.attendance.getDefaultTimes.useQuery(undefined, {
		enabled: !!sessionData?.user,
	});

	// 기본 출퇴근 시간 설정 뮤테이션
	const updateDefaultTimesMutation =
		api.attendance.updateDefaultTimes.useMutation({
			onSuccess: () => {
				toast.success(t("defaultTimesUpdated"));
				refetchDefaultTimes();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	// 개별 사용자 시간 설정 뮤테이션
	const updateUserTimeMutation = api.attendance.updateDefaultTimes.useMutation({
		onSuccess: () => {
			toast.success(t("userTimeUpdated"));
			refetchDefaultTimes();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// 공휴일 목록 조회
	const { data: holidays, refetch: refetchHolidays } =
		api.attendance.getHolidays.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});

	// 공휴일 추가/수정/삭제 뮤테이션
	const createHolidayMutation = api.attendance.createHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
			setIsHolidayDialogOpen(false);
		},
	});

	const updateHolidayMutation = api.attendance.updateHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
			setIsHolidayDialogOpen(false);
			setEditingHoliday(null);
		},
	});

	const deleteHolidayMutation = api.attendance.deleteHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
		},
	});

	const allMonthlyRecords =
		monthlyData?.pages.flatMap((page) => page.items) ?? [];

	const getStatusBadge = (status: string) => {
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

	const formatTime = (time: Date | null) => {
		if (!time) return "-";
		return format(new Date(time), "HH:mm:ss", { locale: ko });
	};

	const formatDate = (date: string) => {
		return format(new Date(date), "MM월 dd일 (E)", { locale: ko });
	};

	const getAttendanceStats = () => {
		if (!todayStatus)
			return { total: 0, clockedIn: 0, clockedOut: 0, late: 0, earlyLeave: 0 };

		const total = todayStatus.length;
		const clockedIn = todayStatus.filter((r) => r.clockInTime).length;
		const clockedOut = todayStatus.filter((r) => r.clockOutTime).length;
		const late = todayStatus.filter((r) => r.status === "late").length;
		const earlyLeave = todayStatus.filter(
			(r) => r.status === "early_leave",
		).length;

		return { total, clockedIn, clockedOut, late, earlyLeave };
	};

	const stats = getAttendanceStats();

	const handleWorkplaceSubmit = (formData: FormData) => {
		const name = formData.get("name") as string;
		const latitude = formData.get("latitude") as string;
		const longitude = formData.get("longitude") as string;
		const radius = Number(formData.get("radius"));

		if (editingWorkplace) {
			updateWorkplaceMutation.mutate({
				id: editingWorkplace.id,
				name,
				latitude,
				longitude,
				radius,
			});
		} else {
			createWorkplaceMutation.mutate({
				name,
				latitude,
				longitude,
				radius,
			});
		}
	};

	const handleEditWorkplace = (workplace: Workplaces[number]) => {
		setEditingWorkplace(workplace);
		setIsWorkplaceDialogOpen(true);
	};

	const handleDeleteWorkplace = (id: number) => {
		if (confirm(t("confirmDelete"))) {
			deleteWorkplaceMutation.mutate({ id });
		}
	};

	const handleHolidaySubmit = (formData: FormData) => {
		const name = formData.get("name") as string;
		const type = holidayType;
		const weeklyDay = formData.get("weeklyDay") as string;
		const specificDate = formData.get("specificDate") as string;
		const description = formData.get("description") as string;

		if (!name || !type) return;

		const data = {
			name,
			type,
			description,
			...(type === "weekly" && { weeklyDay: Number.parseInt(weeklyDay) }),
			...(type === "specific_date" && { specificDate }),
		};

		if (editingHoliday) {
			updateHolidayMutation.mutate({
				id: editingHoliday.id,
				...data,
			});
		} else {
			createHolidayMutation.mutate(data);
		}

		setIsHolidayDialogOpen(false);
		setEditingHoliday(null);
		setHolidayType("specific_date");
	};

	const handleEditHoliday = (holiday: Holidays[number]) => {
		setEditingHoliday(holiday);
		setHolidayType(holiday.type);
		setIsHolidayDialogOpen(true);
	};

	const handleDeleteHoliday = (id: number) => {
		if (confirm(t("confirmDelete"))) {
			deleteHolidayMutation.mutate({ id });
		}
	};

	const getDayName = (day: number) => {
		const dayNames = [
			t("sunday"),
			t("monday"),
			t("tuesday"),
			t("wednesday"),
			t("thursday"),
			t("friday"),
			t("saturday"),
		];
		return dayNames[day] || `Day ${day}`;
	};

	// 상태값을 번역 키로 매핑하는 함수
	const getStatusTranslationKey = (status: string): TranslationKey => {
		switch (status) {
			case "normal":
				return "normal";
			case "late":
				return "late";
			case "early_leave":
				return "earlyLeave";
			case "absent":
				return "absent";
			default:
				return "normal";
		}
	};

	// 공휴일 다이얼로그가 열릴 때 타입 초기화
	useEffect(() => {
		if (isHolidayDialogOpen && !editingHoliday) {
			setHolidayType("specific_date");
		}
	}, [isHolidayDialogOpen, editingHoliday]);

	const handleSaveDefaultTimes = () => {
		// 모든 사용자에게 기본 시간 적용
		if (defaultTimes && defaultTimes.length > 0) {
			for (const setting of defaultTimes) {
				updateDefaultTimesMutation.mutate({
					userId: setting.userId,
					defaultClockInTime,
					defaultClockOutTime,
				});
			}
		}
	};

	const handleUpdateUserTime = (
		userId: string,
		clockInTime: string,
		clockOutTime: string,
	) => {
		updateUserTimeMutation.mutate({
			userId,
			defaultClockInTime: clockInTime,
			defaultClockOutTime: clockOutTime,
		});
	};

	const monthlyRecords = allMonthlyRecords.map((record) => ({
		...record,
		date: record.date,
		clockInTime: record.clockInTime,
		clockOutTime: record.clockOutTime,
		status: record.status,
		user: record.user,
		workplace: record.workplace,
	}));

	if (todayLoading || monthlyLoading) {
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
				<title>{t("adminPanel")} - Clock In</title>
			</Head>

			<div className="container mx-auto max-w-6xl p-4">
				<div className="mb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="font-bold text-2xl">{t("adminPanel")}</h1>
							<p className="mt-1 text-muted-foreground">
								{t("adminPanelDescription")}
							</p>
						</div>
					</div>
				</div>

				<Tabs defaultValue="today" className="w-full space-y-6">
					<TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
						<TabsTrigger value="today">{t("todayStatus")}</TabsTrigger>
						<TabsTrigger value="monthly">{t("monthlyRecords")}</TabsTrigger>
						<TabsTrigger value="workplaces">
							{t("workplaceSettings")}
						</TabsTrigger>
						<TabsTrigger value="times">{t("timeSettings")}</TabsTrigger>
						<TabsTrigger value="holidays">{t("holidays")}</TabsTrigger>
					</TabsList>

					<TabsContent value="today" className="space-y-4">
						<div className="space-y-4">
							{todayStatus?.length === 0 ? (
								<Card>
									<CardContent className="p-8 text-center">
										<Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
										<p className="font-semibold text-lg text-muted-foreground">
											{t("noAttendanceToday")}
										</p>
										<p className="mt-2 text-muted-foreground text-sm">
											{t("noAttendanceTodayDescription")}
										</p>
									</CardContent>
								</Card>
							) : (
								todayStatus?.map((record) => (
									<Card key={record.id}>
										<CardContent className="p-4">
											<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
												<div className="flex-1">
													<div className="mb-2 flex items-center gap-2">
														<h3 className="font-semibold">
															{record.user?.name ||
																record.user?.email ||
																"Unknown"}
														</h3>
														<Badge
															variant={
																record.status === "normal"
																	? "default"
																	: record.status === "late"
																		? "destructive"
																		: "secondary"
															}
														>
															{t(getStatusTranslationKey(record.status))}
														</Badge>
													</div>
													<div className="grid grid-cols-1 gap-2 text-muted-foreground text-sm sm:grid-cols-2">
														<div>
															{t("clockIn")}:{" "}
															{record.clockInTime
																? format(
																		new Date(record.clockInTime),
																		"HH:mm",
																		{
																			locale: ko,
																		},
																	)
																: "-"}
														</div>
														<div>
															{t("clockOut")}:{" "}
															{record.clockOutTime
																? format(
																		new Date(record.clockOutTime),
																		"HH:mm",
																		{
																			locale: ko,
																		},
																	)
																: "-"}
														</div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="monthly" className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Filter className="h-4 w-4" />
								<span className="font-medium text-sm">
									{t("filterLateEarly")}
								</span>
								<Switch
									checked={filterLateEarly}
									onCheckedChange={setFilterLateEarly}
								/>
							</div>
							<Button variant="outline" size="sm">
								<Download className="mr-2 h-4 w-4" />
								{t("export")}
							</Button>
						</div>

						<div className="space-y-4">
							{monthlyRecords?.length === 0 ? (
								<Card>
									<CardContent className="p-8 text-center">
										<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
										<p className="font-semibold text-lg text-muted-foreground">
											{t("noMonthlyRecords")}
										</p>
										<p className="mt-2 text-muted-foreground text-sm">
											{t("noMonthlyRecordsDescription")}
										</p>
									</CardContent>
								</Card>
							) : (
								monthlyRecords?.map((record) => (
									<Card key={record.id}>
										<CardContent className="p-4">
											<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
												<div className="flex-1">
													<div className="mb-2 flex items-center gap-2">
														<h3 className="font-semibold">
															{record.user?.name ||
																record.user?.email ||
																"Unknown"}
														</h3>
														<Badge
															variant={
																record.status === "normal"
																	? "default"
																	: record.status === "late"
																		? "destructive"
																		: "secondary"
															}
														>
															{t(getStatusTranslationKey(record.status))}
														</Badge>
													</div>
													<div className="grid grid-cols-1 gap-2 text-muted-foreground text-sm sm:grid-cols-3">
														<div>
															{t("date")}:{" "}
															{format(new Date(record.date), "yyyy-MM-dd", {
																locale: ko,
															})}
														</div>
														<div>
															{t("clockIn")}:{" "}
															{record.clockInTime
																? format(
																		new Date(record.clockInTime),
																		"HH:mm",
																		{
																			locale: ko,
																		},
																	)
																: "-"}
														</div>
														<div>
															{t("clockOut")}:{" "}
															{record.clockOutTime
																? format(
																		new Date(record.clockOutTime),
																		"HH:mm",
																		{
																			locale: ko,
																		},
																	)
																: "-"}
														</div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))
							)}

							{hasNextPage && (
								<div className="flex justify-center pt-4">
									<Button
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										variant="outline"
									>
										{isFetchingNextPage ? t("loading") : t("loadMore")}
									</Button>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="workplaces" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<MapPin className="h-5 w-5" />
									<span>{t("workplaceSettings")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									{t("workplaceSettingsDescription")}
								</p>

								<div className="space-y-4">
									{workplaces?.length === 0 ? (
										<div className="py-8 text-center">
											<MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="font-semibold text-lg text-muted-foreground">
												{t("noWorkplaces")}
											</p>
											<p className="mt-2 text-muted-foreground text-sm">
												{t("noWorkplacesDescription")}
											</p>
										</div>
									) : (
										workplaces?.map((workplace) => (
											<Card key={workplace.id}>
												<CardContent className="p-4">
													<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
														<div className="flex-1">
															<h3 className="font-semibold">
																{workplace.name}
															</h3>
															<p className="mt-1 text-muted-foreground text-sm">
																{workplace.latitude}, {workplace.longitude}
															</p>
															<p className="text-muted-foreground text-sm">
																{t("radius")}: {workplace.radius}m
															</p>
														</div>
														<div className="flex gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleEditWorkplace(workplace)}
															>
																{t("edit")}
															</Button>
															<Button
																variant="destructive"
																size="sm"
																onClick={() =>
																	handleDeleteWorkplace(workplace.id)
																}
															>
																{t("delete")}
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
								</div>

								<Button
									onClick={() => setIsWorkplaceDialogOpen(true)}
									className="mt-4"
								>
									{t("addWorkplace")}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="times" className="space-y-6">
						{/* 기본 시간 설정 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Clock className="h-5 w-5" />
									<span>{t("defaultTimes")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground">
									{t("defaultTimesDescription")}
								</p>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<Label htmlFor="defaultClockInTime">
											{t("defaultClockIn")}
										</Label>
										<TimePicker
											value={defaultClockInTime}
											onChange={setDefaultClockInTime}
										/>
									</div>
									<div>
										<Label htmlFor="defaultClockOutTime">
											{t("defaultClockOut")}
										</Label>
										<TimePicker
											value={defaultClockOutTime}
											onChange={setDefaultClockOutTime}
										/>
									</div>
								</div>

								<Button onClick={handleSaveDefaultTimes} className="w-full">
									{t("applyToAllUsers")}
								</Button>
							</CardContent>
						</Card>

						{/* 개별 시간 설정 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Users className="h-5 w-5" />
									<span>{t("individualTimes")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									{t("individualTimesDescription")}
								</p>

								{isLoading ? (
									<div className="flex h-32 items-center justify-center">
										<div className="text-center">
											<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
											<p className="text-muted-foreground">{t("loading")}</p>
										</div>
									</div>
								) : !defaultTimes || defaultTimes.length === 0 ? (
									<div className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="font-semibold text-lg text-muted-foreground">
												{t("noUserSettings")}
											</p>
											<p className="mt-2 text-muted-foreground text-sm">
												{t("userSettingsGuide")}
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										{defaultTimes.map((setting) => (
											<UserTimeCard
												key={setting.userId}
												setting={setting}
												onUpdate={handleUpdateUserTime}
											/>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="holidays" className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="font-semibold text-xl">
								{t("holidayManagement")}
							</h2>
							<Dialog
								open={isHolidayDialogOpen}
								onOpenChange={setIsHolidayDialogOpen}
							>
								<DialogTrigger asChild>
									<Button onClick={() => setEditingHoliday(null)}>
										<Plus className="mr-2 h-4 w-4" />
										{t("addHoliday")}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											{editingHoliday ? t("editHoliday") : t("addHoliday")}
										</DialogTitle>
									</DialogHeader>
									<form action={handleHolidaySubmit} className="space-y-4">
										<div>
											<Label htmlFor="name">{t("holidayName")}</Label>
											<Input
												id="name"
												name="name"
												defaultValue={editingHoliday?.name || ""}
												required
											/>
										</div>
										<div>
											<Label htmlFor="type">{t("holidayType")}</Label>
											<Select
												name="type"
												value={holidayType}
												onValueChange={(value: "weekly" | "specific_date") =>
													setHolidayType(value)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder={t("selectHolidayType")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="weekly">
														{t("weeklyHoliday")}
													</SelectItem>
													<SelectItem value="specific_date">
														{t("specificDateHoliday")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										{holidayType === "weekly" && (
											<div>
												<Label htmlFor="weeklyDay">{t("weeklyDay")}</Label>
												<Select
													name="weeklyDay"
													defaultValue={
														editingHoliday?.weeklyDay?.toString() || "0"
													}
												>
													<SelectTrigger>
														<SelectValue placeholder={t("selectDayOfWeek")} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="0">{t("sunday")}</SelectItem>
														<SelectItem value="1">{t("monday")}</SelectItem>
														<SelectItem value="2">{t("tuesday")}</SelectItem>
														<SelectItem value="3">{t("wednesday")}</SelectItem>
														<SelectItem value="4">{t("thursday")}</SelectItem>
														<SelectItem value="5">{t("friday")}</SelectItem>
														<SelectItem value="6">{t("saturday")}</SelectItem>
													</SelectContent>
												</Select>
											</div>
										)}
										{holidayType === "specific_date" && (
											<div>
												<Label htmlFor="specificDate">
													{t("specificDate")}
												</Label>
												<DatePicker
													value={editingHoliday?.specificDate || ""}
													onChange={(date) => {
														// 폼에 값을 반영하기 위해 hidden input도 같이 사용
														const input = document.getElementById(
															"specificDateInput",
														) as HTMLInputElement;
														if (input) input.value = date;
													}}
												/>
												<input
													type="hidden"
													id="specificDateInput"
													name="specificDate"
													defaultValue={editingHoliday?.specificDate || ""}
												/>
											</div>
										)}
										<div>
											<Label htmlFor="description">{t("description")}</Label>
											<Textarea
												id="description"
												name="description"
												placeholder={t("enterDescription")}
												defaultValue={editingHoliday?.description || ""}
											/>
										</div>
										<div className="flex justify-end space-x-2">
											<Button
												type="button"
												variant="outline"
												onClick={() => setIsHolidayDialogOpen(false)}
											>
												{t("cancel")}
											</Button>
											<Button type="submit">
												{editingHoliday ? t("save") : t("add")}
											</Button>
										</div>
									</form>
								</DialogContent>
							</Dialog>
						</div>

						<div className="space-y-4">
							{holidays?.length === 0 ? (
								<Card>
									<CardContent className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="text-muted-foreground">{t("noHolidays")}</p>
										</div>
									</CardContent>
								</Card>
							) : (
								holidays?.map((holiday) => (
									<Card key={holiday.id}>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<h3 className="font-semibold">{holiday.name}</h3>
													<p className="text-muted-foreground text-sm">
														{holiday.type === "weekly"
															? `${t("weeklyHoliday")}: ${getDayName(
																	holiday.weeklyDay || 0,
																)}`
															: `${t("specificDateHoliday")}: ${holiday.specificDate}`}
													</p>
													{holiday.description && (
														<p className="mt-1 text-muted-foreground text-sm">
															{holiday.description}
														</p>
													)}
												</div>
												<div className="flex items-center space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditHoliday(holiday)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteHoliday(holiday.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
