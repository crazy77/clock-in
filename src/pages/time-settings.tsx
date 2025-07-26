import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

import { ArrowLeft, Clock, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";
import { TimePicker } from "~/components/ui/TimePicker";
import { AdminGuard } from "~/components/ui/AdminGuard";

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
	const { data: defaultTimes, refetch: refetchDefaultTimes } =
		api.attendance.getDefaultTimes.useQuery(undefined, {
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
		if (defaultTimes) {
			defaultTimes.forEach((setting) => {
				updateDefaultTimesMutation.mutate({
					userId: setting.userId,
					defaultClockInTime,
					defaultClockOutTime,
				});
			});
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

			<div className="container mx-auto p-4">
				<div className="mb-6">
					<div className="mb-2 flex items-center space-x-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => window.history.back()}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<h1 className="font-bold text-3xl">{t("timeSettings")}</h1>
					</div>
					<p className="text-muted-foreground">
						{t("timeSettingsDescription")}
					</p>
				</div>

				<Tabs defaultValue="default" className="space-y-4">
					<TabsList>
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

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<Label htmlFor="defaultClockInTime">
											{t("defaultClockIn")}
										</Label>
										<TimePicker value={defaultClockInTime} onChange={setDefaultClockInTime} />
									</div>
									<div>
										<Label htmlFor="defaultClockOutTime">
											{t("defaultClockOut")}
										</Label>
										<TimePicker value={defaultClockOutTime} onChange={setDefaultClockOutTime} />
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

								<div className="space-y-4">
									{defaultTimes?.length === 0 ? (
										<div className="flex h-32 items-center justify-center">
											<div className="text-center">
												<Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
												<p className="text-muted-foreground font-semibold text-lg">
													{t("noUserSettings")}
												</p>
												<p className="text-muted-foreground text-sm mt-2">
													{t("userSettingsGuide")}
												</p>
											</div>
										</div>
									) : (
										defaultTimes?.map((setting) => (
											<UserTimeCard
												key={setting.id}
												setting={setting}
												onUpdate={handleUpdateUserTime}
											/>
										))
									)}
								</div>
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
	setting: any;
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
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<h3 className="font-semibold">
							{setting.user?.name || setting.user?.email || "Unknown"}
						</h3>

						{isEditing ? (
							<div className="mt-3 grid grid-cols-2 gap-4">
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
						) : (
							<div className="mt-2 grid grid-cols-2 gap-4">
								<div>
									<Label className="text-muted-foreground text-sm">
										{t("defaultClockIn")}
									</Label>
									<p className="font-medium">{setting.defaultClockInTime}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-sm">
										{t("defaultClockOut")}
									</Label>
									<p className="font-medium">{setting.defaultClockOutTime}</p>
								</div>
							</div>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{isEditing ? (
							<>
								<Button variant="outline" size="sm" onClick={handleCancel}>
									{t("cancel")}
								</Button>
								<Button size="sm" onClick={handleSave}>
									{t("save")}
								</Button>
							</>
						) : (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(true)}
							>
								{t("edit")}
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
