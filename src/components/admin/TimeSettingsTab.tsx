import { Clock, Settings, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { TimePicker } from "~/components/ui/TimePicker";
import { UserTimeCard } from "~/components/ui/UserTimeCard";
import { useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";

export function TimeSettingsTab() {
	const { t } = useTranslation();
	const [defaultClockInTime, setDefaultClockInTime] = useState("09:00");
	const [defaultClockOutTime, setDefaultClockOutTime] = useState("18:00");

	// 기본 시간 데이터 조회
	const { data: defaultTimes, isLoading } =
		api.attendance.getDefaultTimes.useQuery();

	// 개별 사용자 시간 업데이트 뮤테이션
	const updateDefaultTimesMutation =
		api.attendance.updateDefaultTimes.useMutation({
			onSuccess: () => {
				toast.success(t("defaultTimesSaved"));
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const handleSaveDefaultTimes = () => {
		// 모든 사용자에게 기본 시간 적용
		if (defaultTimes && defaultTimes.length > 0) {
			for (const userTime of defaultTimes) {
				updateDefaultTimesMutation.mutate({
					userId: userTime.userId,
					defaultClockInTime: defaultClockInTime,
					defaultClockOutTime: defaultClockOutTime,
				});
			}
		}
	};

	const handleUpdateUserTime = (
		userId: string,
		clockInTime: string,
		clockOutTime: string,
	) => {
		updateDefaultTimesMutation.mutate({
			userId,
			defaultClockInTime: clockInTime,
			defaultClockOutTime: clockOutTime,
		});
	};

	return (
		<div className="space-y-6">
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
							<Label htmlFor="defaultClockInTime">{t("defaultClockIn")}</Label>
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

					<Button
						onClick={handleSaveDefaultTimes}
						className="w-full"
						disabled={updateDefaultTimesMutation.isPending}
					>
						{updateDefaultTimesMutation.isPending
							? t("saving")
							: t("applyToAllUsers")}
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
					<p className="mb-4 text-muted-foreground text-sm">
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
						<div className="py-8 text-center">
							<Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">{t("noUserTimes")}</p>
						</div>
					) : (
						<div className="space-y-4">
							{defaultTimes.map((userTime) => (
								<UserTimeCard
									key={userTime.userId}
									setting={userTime}
									onUpdate={(clockInTime, clockOutTime) =>
										handleUpdateUserTime(
											userTime.userId,
											clockInTime,
											clockOutTime,
										)
									}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
