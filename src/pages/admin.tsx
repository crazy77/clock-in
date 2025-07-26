import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
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
import { api } from "~/utils/api";
import { DatePicker } from "~/components/ui/DatePicker";
import { AdminGuard } from "~/components/ui/AdminGuard";

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
	const [editingWorkplace, setEditingWorkplace] = useState<{
		id: number;
		name: string;
		latitude: number;
		longitude: number;
		radius: number;
	} | null>(null);
	const [editingHoliday, setEditingHoliday] = useState<{
		id: number;
		name: string;
		type: "weekly" | "specific_date";
		weeklyDay?: number;
		specificDate?: string;
		description?: string;
	} | null>(null);
	const [holidayType, setHolidayType] = useState<"weekly" | "specific_date">(
		"specific_date",
	);

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
	const { data: defaultTimes, refetch: refetchDefaultTimes } =
		api.attendance.getDefaultTimes.useQuery(undefined, {
			enabled: !!sessionData?.user,
		});

	// 기본 출퇴근 시간 설정 뮤테이션
	const updateDefaultTimesMutation =
		api.attendance.updateDefaultTimes.useMutation({
			onSuccess: () => {
				refetchDefaultTimes();
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
				return <Badge variant="outline">{status}</Badge>;
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

	const handleEditWorkplace = (workplace: any) => {
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
			...(type === "weekly" && { weeklyDay: parseInt(weeklyDay) }),
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

	const handleEditHoliday = (holiday: any) => {
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

	// 공휴일 다이얼로그가 열릴 때 타입 초기화
	useEffect(() => {
		if (isHolidayDialogOpen && !editingHoliday) {
			setHolidayType("specific_date");
		}
	}, [isHolidayDialogOpen, editingHoliday]);

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

			<div className="container mx-auto p-4">
				<div className="mb-6">
					<h1 className="mb-2 font-bold text-3xl">{t("adminPanel")}</h1>
					<p className="text-muted-foreground">{t("adminPanelDescription")}</p>
				</div>

				{/* 통계 카드 */}
				<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Users className="h-4 w-4 text-blue-600" />
								<span className="font-medium text-sm">
									{t("totalEmployees")}
								</span>
							</div>
							<p className="font-bold text-2xl">{stats.total}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<TrendingUp className="h-4 w-4 text-green-600" />
								<span className="font-medium text-sm">{t("clockedIn")}</span>
							</div>
							<p className="font-bold text-2xl">{stats.clockedIn}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<TrendingDown className="h-4 w-4 text-red-600" />
								<span className="font-medium text-sm">{t("clockedOut")}</span>
							</div>
							<p className="font-bold text-2xl">{stats.clockedOut}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-orange-600" />
								<span className="font-medium text-sm">{t("late")}</span>
							</div>
							<p className="font-bold text-2xl">{stats.late}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-purple-600" />
								<span className="font-medium text-sm">{t("earlyLeave")}</span>
							</div>
							<p className="font-bold text-2xl">{stats.earlyLeave}</p>
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="today" className="space-y-4">
					<TabsList>
						<TabsTrigger value="today">{t("todayStatus")}</TabsTrigger>
						<TabsTrigger value="monthly">{t("monthlyRecords")}</TabsTrigger>
						<TabsTrigger value="workplaces">
							{t("workplaceSettings")}
						</TabsTrigger>
						<TabsTrigger value="holidays">{t("holidays")}</TabsTrigger>
					</TabsList>

					{/* 시간 설정 링크 */}
					<div className="flex justify-end">
						<Link href="/time-settings">
							<Button variant="outline">
								<Clock className="mr-2 h-4 w-4" />
								{t("timeSettings")}
							</Button>
						</Link>
					</div>

					<TabsContent value="today" className="space-y-4">
						<div className="space-y-4">
							{todayStatus?.length === 0 ? (
								<Card>
									<CardContent className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="text-muted-foreground">
												{t("noRecordsToday")}
											</p>
										</div>
									</CardContent>
								</Card>
							) : (
								todayStatus?.map((record) => (
									<Card key={record.id}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<Users className="h-5 w-5" />
													<span className="font-semibold">
														{record.user?.name ||
															record.user?.email ||
															"Unknown"}
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
															{formatTime(record.clockInTime)}
														</span>
													</div>
													{record.clockInLocation && (
														<div className="flex items-center space-x-2 text-muted-foreground text-sm">
															<MapPin className="h-3 w-3" />
															<span>
																{(
																	record.clockInLocation as any
																).latitude.toFixed(6)}
																,{" "}
																{(
																	record.clockInLocation as any
																).longitude.toFixed(6)}
															</span>
														</div>
													)}
												</div>

												<div className="space-y-3">
													<div className="flex items-center space-x-2">
														<TrendingDown className="h-4 w-4 text-red-600" />
														<span className="font-medium">{t("clockOut")}</span>
														<span className="text-muted-foreground text-sm">
															{formatTime(record.clockOutTime)}
														</span>
													</div>
													{record.clockOutLocation && (
														<div className="flex items-center space-x-2 text-muted-foreground text-sm">
															<MapPin className="h-3 w-3" />
															<span>
																{(
																	record.clockOutLocation as any
																).latitude.toFixed(6)}
																,{" "}
																{(
																	record.clockOutLocation as any
																).longitude.toFixed(6)}
															</span>
														</div>
													)}
												</div>
											</div>

											{record.workplace && (
												<>
													<Separator className="my-4" />
													<div className="flex items-center space-x-2 text-muted-foreground text-sm">
														<Building className="h-3 w-3" />
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
							{allMonthlyRecords.length === 0 ? (
								<Card>
									<CardContent className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="text-muted-foreground">
												{t("noMonthlyRecords")}
											</p>
										</div>
									</CardContent>
								</Card>
							) : (
								allMonthlyRecords.map((record) => (
									<Card key={record.id}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<Calendar className="h-5 w-5" />
													<span className="font-semibold">
														{formatDate(record.date)}
													</span>
													<span className="text-muted-foreground text-sm">
														{record.user?.name ||
															record.user?.email ||
															"Unknown"}
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
															{formatTime(record.clockInTime)}
														</span>
													</div>
												</div>

												<div className="space-y-3">
													<div className="flex items-center space-x-2">
														<TrendingDown className="h-4 w-4 text-red-600" />
														<span className="font-medium">{t("clockOut")}</span>
														<span className="text-muted-foreground text-sm">
															{formatTime(record.clockOutTime)}
														</span>
													</div>
												</div>
											</div>

											{record.workplace && (
												<>
													<Separator className="my-4" />
													<div className="flex items-center space-x-2 text-muted-foreground text-sm">
														<Building className="h-3 w-3" />
														<span>{record.workplace.name}</span>
													</div>
												</>
											)}
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
						<div className="flex items-center justify-between">
							<h2 className="font-semibold text-xl">
								{t("workplaceSettings")}
							</h2>
							<Dialog
								open={isWorkplaceDialogOpen}
								onOpenChange={setIsWorkplaceDialogOpen}
							>
								<DialogTrigger asChild>
									<Button onClick={() => setEditingWorkplace(null)}>
										<Plus className="mr-2 h-4 w-4" />
										{t("addWorkplace")}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											{editingWorkplace
												? t("editWorkplace")
												: t("addWorkplace")}
										</DialogTitle>
									</DialogHeader>
									<form action={handleWorkplaceSubmit} className="space-y-4">
										<div>
											<Label htmlFor="name">{t("workplaceName")}</Label>
											<Input
												id="name"
												name="name"
												defaultValue={editingWorkplace?.name || ""}
												required
											/>
										</div>
										<div>
											<Label htmlFor="latitude">{t("latitude")}</Label>
											<Input
												id="latitude"
												name="latitude"
												type="number"
												step="any"
												defaultValue={editingWorkplace?.latitude || ""}
												required
											/>
										</div>
										<div>
											<Label htmlFor="longitude">{t("longitude")}</Label>
											<Input
												id="longitude"
												name="longitude"
												type="number"
												step="any"
												defaultValue={editingWorkplace?.longitude || ""}
												required
											/>
										</div>
										<div>
											<Label htmlFor="radius">{t("radius")} (m)</Label>
											<Input
												id="radius"
												name="radius"
												type="number"
												defaultValue={editingWorkplace?.radius || 100}
												required
											/>
										</div>
										<div className="flex justify-end space-x-2">
											<Button
												type="button"
												variant="outline"
												onClick={() => setIsWorkplaceDialogOpen(false)}
											>
												{t("cancel")}
											</Button>
											<Button type="submit">
												{editingWorkplace ? t("save") : t("add")}
											</Button>
										</div>
									</form>
								</DialogContent>
							</Dialog>
						</div>

						<div className="space-y-4">
							{workplaces?.length === 0 ? (
								<Card>
									<CardContent className="flex h-32 items-center justify-center">
										<div className="text-center">
											<Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<p className="text-muted-foreground">
												{t("noWorkplaces")}
											</p>
										</div>
									</CardContent>
								</Card>
							) : (
								workplaces?.map((workplace) => (
									<Card key={workplace.id}>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<h3 className="font-semibold">{workplace.name}</h3>
													<p className="text-muted-foreground text-sm">
														{workplace.latitude}, {workplace.longitude}
													</p>
													<p className="text-muted-foreground text-sm">
														{t("radius")}: {workplace.radius}m
													</p>
												</div>
												<div className="flex items-center space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditWorkplace(workplace)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteWorkplace(workplace.id)}
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
												<Label htmlFor="specificDate">{t("specificDate")}</Label>
												<DatePicker
													value={editingHoliday?.specificDate || ""}
													onChange={(date) => {
														// 폼에 값을 반영하기 위해 hidden input도 같이 사용
														const input = document.getElementById("specificDateInput") as HTMLInputElement;
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
