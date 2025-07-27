import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Clock, Users } from "lucide-react";
import Image from "next/image";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getStatusTranslationKey, useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";

export function TodayStatusTab() {
	const { t } = useTranslation();

	// 오늘 출퇴근 상황 조회
	const { data: todayStatus, isLoading } =
		api.attendance.getTodayStatus.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-32 items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">{t("loading")}</p>
				</div>
			</div>
		);
	}

	if (!todayStatus || todayStatus.length === 0) {
		return (
			<Card>
				<CardContent className="p-8 text-center">
					<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<p className="font-semibold text-lg text-muted-foreground">
						{t("noTodayRecords")}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{t("noTodayRecordsDescription")}
					</p>
				</CardContent>
			</Card>
		);
	}

	const workingHour = (clockInTime: Date, clockOutTime: Date) => {
		const workTime =
			new Date(clockOutTime).getTime() - new Date(clockInTime).getTime();
		const hours = Math.floor(workTime / (1000 * 60 * 60));
		const minutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}시간 ${minutes}분`;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center space-x-2">
				<Users className="h-5 w-5" />
				<h2 className="font-semibold text-lg">{t("todayStatus")}</h2>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{todayStatus.map((record) => (
					<Card key={record.id}>
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								{record.user?.image ? (
									<Image
										src={record.user.image}
										alt="User"
										width={24}
										height={24}
										className="rounded-full"
									/>
								) : (
									<Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
								)}
								<CardTitle className="text-base">
									{record.user?.name || record.user?.email || "Unknown"}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
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
								<span className="text-muted-foreground text-sm">
									{format(new Date(record.date), "MM/dd (E)", {
										locale: ko,
									})}
								</span>
							</div>

							<div className="space-y-2 text-sm">
								<div className="flex items-center space-x-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">
										{t("clockIn")}:{" "}
										{record.clockInTime ? format(new Date(record.clockInTime), "HH:mm") : "-"}
									</span>
								</div>
								{record.clockOutTime && (
									<div className="flex items-center space-x-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">
											{t("clockOut")}:{" "}
											{format(new Date(record.clockOutTime), "HH:mm")}
										</span>
									</div>
								)}
								{record.clockOutTime && record.clockInTime && (
									<div className="font-medium">
										{t("workingHours")}:{" "}
										{workingHour(record.clockInTime, record.clockOutTime)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
