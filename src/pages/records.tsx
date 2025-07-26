import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

import { Calendar, Clock, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";

export default function RecordsPage() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const [cursor, setCursor] = useState<number | undefined>(undefined);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		api.attendance.getRecords.useInfiniteQuery(
			{
				limit: 20,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
				enabled: !!sessionData?.user,
			}
		);

	const allRecords = data?.pages.flatMap((page) => page.items) ?? [];

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
		return format(new Date(date), "yyyy년 MM월 dd일 (E)", { locale: ko });
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-center h-64">
					<div className="text-lg">{t("loading")}</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{t("attendanceRecords")} - Clock In</title>
			</Head>

			<div className="container mx-auto p-4">
				<div className="mb-6">
					<h1 className="text-3xl font-bold mb-2">{t("attendanceRecords")}</h1>
					<p className="text-muted-foreground">
						{t("attendanceRecordsDescription")}
					</p>
				</div>

				<div className="space-y-4">
					{allRecords.length === 0 ? (
						<Card>
							<CardContent className="flex items-center justify-center h-32">
								<div className="text-center">
									<Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
									<p className="text-muted-foreground">{t("noRecords")}</p>
								</div>
							</CardContent>
						</Card>
					) : (
						allRecords.map((record) => (
							<Card key={record.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Calendar className="h-5 w-5" />
											<span className="font-semibold">
												{formatDate(record.date)}
											</span>
										</div>
										{getStatusBadge(record.status)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-3">
											<div className="flex items-center space-x-2">
												<TrendingUp className="h-4 w-4 text-green-600" />
												<span className="font-medium">{t("clockIn")}</span>
												<span className="text-sm text-muted-foreground">
													{formatTime(record.clockInTime)}
												</span>
											</div>
											{record.clockInLocation && (
												<div className="flex items-center space-x-2 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3" />
													<span>
														{record.clockInLocation.latitude.toFixed(6)},{" "}
														{record.clockInLocation.longitude.toFixed(6)}
													</span>
												</div>
											)}
										</div>

										<div className="space-y-3">
											<div className="flex items-center space-x-2">
												<TrendingDown className="h-4 w-4 text-red-600" />
												<span className="font-medium">{t("clockOut")}</span>
												<span className="text-sm text-muted-foreground">
													{formatTime(record.clockOutTime)}
												</span>
											</div>
											{record.clockOutLocation && (
												<div className="flex items-center space-x-2 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3" />
													<span>
														{record.clockOutLocation.latitude.toFixed(6)},{" "}
														{record.clockOutLocation.longitude.toFixed(6)}
													</span>
												</div>
											)}
										</div>
									</div>

									{record.workplace && (
										<>
											<Separator className="my-4" />
											<div className="flex items-center space-x-2 text-sm text-muted-foreground">
												<MapPin className="h-3 w-3" />
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
			</div>
		</>
	);
} 