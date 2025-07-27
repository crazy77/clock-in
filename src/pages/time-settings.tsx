import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

import type { inferProcedureOutput } from "@trpc/server";
import { ArrowLeft, Clock, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "~/components/ui/AdminGuard";
import { TimePicker } from "~/components/ui/TimePicker";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTranslation } from "~/lib/i18n";
import { type RouterOutputs, api } from "~/utils/api";

type DefaultTime = RouterOutputs["attendance"]["getDefaultTimes"];

export default function TimeSettingsPage() {
	return (
		<AdminGuard>
			<TimeSettingsPageContent />
		</AdminGuard>
	);
}

function TimeSettingsPageContent() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const [defaultClockInTime, setDefaultClockInTime] = useState("09:00");
	const [defaultClockOutTime, setDefaultClockOutTime] = useState("18:00");

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

	if (!sessionData?.user) {
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
				<title>{t("timeSettings")} - Clock In</title>
			</Head>

			<div className="container mx-auto max-w-4xl p-4">
				<div className="mb-6">
					<Button
						variant="ghost"
						onClick={() => window.history.back()}
						className="mb-4"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("back")}
					</Button>

					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="font-bold text-2xl">{t("timeSettings")}</h1>
							<p className="mt-1 text-muted-foreground">
								{t("timeSettingsDescription")}
							</p>
						</div>
					</div>
				</div>

				<Tabs defaultValue="default" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="default">{t("defaultTimes")}</TabsTrigger>
						<TabsTrigger value="individual">{t("individualTimes")}</TabsTrigger>
					</TabsList>

					<TabsContent value="default" className="space-y-4">
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
					</TabsContent>

					<TabsContent value="individual" className="space-y-4">
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
				</Tabs>
			</div>
		</>
	);
}

// 개별 사용자 시간 설정 카드 컴포넌트
function UserTimeCard({
	setting,
	onUpdate,
}: {
	setting: DefaultTime[number];
	onUpdate: (userId: string, clockInTime: string, clockOutTime: string) => void;
}) {
	const { t } = useTranslation();
	const [clockInTime, setClockInTime] = useState(setting.defaultClockInTime);
	const [clockOutTime, setClockOutTime] = useState(setting.defaultClockOutTime);
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = () => {
		onUpdate(setting.userId, clockInTime, clockOutTime);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setClockInTime(setting.defaultClockInTime);
		setClockOutTime(setting.defaultClockOutTime);
		setIsEditing(false);
	};

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex-1">
						<h3 className="font-semibold text-base sm:text-lg">
							{setting.name || setting.email || "Unknown User"}
						</h3>
						{setting.email && setting.name && (
							<p className="mt-1 text-muted-foreground text-sm">
								{setting.email}
							</p>
						)}

						{!isEditing && (
							<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										{t("defaultClockIn")}: {setting.defaultClockInTime}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										{t("defaultClockOut")}: {setting.defaultClockOutTime}
									</span>
								</div>
							</div>
						)}

						{isEditing && (
							<div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-sm">
										{t("defaultClockIn")}
									</Label>
									<TimePicker value={clockInTime} onChange={setClockInTime} />
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										{t("defaultClockOut")}
									</Label>
									<TimePicker value={clockOutTime} onChange={setClockOutTime} />
								</div>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-2 sm:flex-row">
						{!isEditing ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(true)}
								className="w-full sm:w-auto"
							>
								{t("edit")}
							</Button>
						) : (
							<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
								<Button
									size="sm"
									onClick={handleSave}
									className="flex-1 sm:flex-none"
								>
									{t("save")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleCancel}
									className="flex-1 sm:flex-none"
								>
									{t("cancel")}
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
