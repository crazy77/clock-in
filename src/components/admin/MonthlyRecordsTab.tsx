import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Download, Filter, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { getStatusTranslationKey, useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";

export function MonthlyRecordsTab() {
	const { t } = useTranslation();
	const [filterLateEarly, setFilterLateEarly] = useState(true);

	// 월별 기록 조회
	const {
		data: monthlyData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = api.attendance.getMonthlyRecords.useInfiniteQuery(
		{
			filterLateEarly,
			limit: 20,
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	);

	const monthlyRecords = monthlyData?.pages.flatMap((page) => page.items) ?? [];

	const workingHour = (clockInTime: Date | null, clockOutTime: Date | null) => {
		if (!clockInTime || !clockOutTime) return "-";
		const workTime =
			new Date(clockOutTime).getTime() - new Date(clockInTime).getTime();
		const hours = Math.floor(workTime / (1000 * 60 * 60));
		const minutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}시간 ${minutes}분`;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4" />
					<span className="font-medium text-sm">{t("filterLateEarly")}</span>
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
				{isLoading ? (
					<div className="flex h-32 items-center justify-center">
						<div className="text-center">
							<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							<p className="text-muted-foreground">{t("loading")}</p>
						</div>
					</div>
				) : monthlyRecords?.length === 0 ? (
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
						<Card key={record.id} className="py-4">
							<CardContent>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex-1">
										<div className="mb-2 flex items-center gap-2">
											<div className="flex items-center gap-2">
												{record.user?.image ? (
													<Image
														src={record.user.image}
														alt="User"
														width={20}
														height={20}
														className="rounded-full"
													/>
												) : (
													<User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
												)}
											</div>
											<h3 className="font-semibold">
												{record.user?.name || record.user?.email || "Unknown"}
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
										<div className="text-muted-foreground text-sm">
											{format(
												new Date(record.date),
												"yyyy년 MM월 dd일 (EEEE)",
												{
													locale: ko,
												},
											)}
										</div>
									</div>
									<div className="text-right">
										<div className="text-sm">
											<div>
												{t("clockIn")}:{" "}
												{record.clockInTime
													? format(new Date(record.clockInTime), "HH:mm", {
															locale: ko,
														})
													: "-"}
											</div>
											<div>
												{t("clockOut")}:{" "}
												{record.clockOutTime
													? format(new Date(record.clockOutTime), "HH:mm", {
															locale: ko,
														})
													: "-"}
											</div>
											{record.clockOutTime && (
												<div className="font-medium">
													{t("workingHours")}:{" "}
													{workingHour(record.clockInTime, record.clockOutTime)}
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{hasNextPage && (
				<div className="flex justify-center">
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
	);
}
