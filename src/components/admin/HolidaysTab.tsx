import { Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HolidayDialog } from "~/components/admin/HolidayDialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type TranslationKey, useTranslation } from "~/lib/i18n";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type Holidays = RouterOutputs["attendance"]["getHolidays"];

export function HolidaysTab() {
	const { t } = useTranslation();
	const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
	const [editingHoliday, setEditingHoliday] = useState<Holidays[number] | null>(
		null,
	);
	const [holidayType, setHolidayType] = useState<"weekly" | "specific_date">(
		"specific_date",
	);

	// 휴일 목록 조회
	const { data: holidays, refetch: refetchHolidays } =
		api.attendance.getHolidays.useQuery();

	// 휴일 추가/수정/삭제 뮤테이션
	const createHolidayMutation = api.attendance.createHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
			setIsHolidayDialogOpen(false);
			toast.success(t("holidayCreated"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateHolidayMutation = api.attendance.updateHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
			setIsHolidayDialogOpen(false);
			setEditingHoliday(null);
			toast.success(t("holidayUpdated"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const deleteHolidayMutation = api.attendance.deleteHoliday.useMutation({
		onSuccess: () => {
			refetchHolidays();
			toast.success(t("holidayDeleted"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleHolidaySubmit = (formData: FormData) => {
		const name = formData.get("name") as string;
		const type = formData.get("type") as "weekly" | "specific_date";
		const weeklyDay =
			type === "weekly" ? Number(formData.get("dayOfWeek")) : undefined;
		const specificDate =
			type === "specific_date" ? (formData.get("date") as string) : undefined;

		if (editingHoliday) {
			updateHolidayMutation.mutate({
				id: editingHoliday.id,
				name,
				type,
				weeklyDay,
				specificDate,
			});
		} else {
			createHolidayMutation.mutate({
				name,
				type,
				weeklyDay,
				specificDate,
			});
		}
	};

	const handleEditHoliday = (holiday: Holidays[number]) => {
		setEditingHoliday(holiday);
		setHolidayType(holiday.type);
		setIsHolidayDialogOpen(true);
	};

	const handleDeleteHoliday = (id: number) => {
		if (confirm(t("confirmDeleteHoliday"))) {
			deleteHolidayMutation.mutate({ id });
		}
	};

	// 새 휴일 추가 시 타입 초기화
	const handleAddHoliday = () => {
		setHolidayType("specific_date");
		setIsHolidayDialogOpen(true);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">{t("holidays")}</h2>
					<p className="text-muted-foreground text-sm">
						{t("holidaysDescription")}
					</p>
				</div>
				<Button onClick={handleAddHoliday}>
					<Plus className="mr-2 h-4 w-4" />
					{t("addHoliday")}
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{holidays?.map((holiday) => (
					<Card key={holiday.id}>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center space-x-2 text-base">
									<Calendar className="h-4 w-4" />
									<span>{holiday.name}</span>
								</CardTitle>
								<div className="flex space-x-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEditHoliday(holiday)}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteHoliday(holiday.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-sm">
								<div className="text-muted-foreground">
									{t("holidayTypeLabel")}:{" "}
									{t(
										holiday.type === "weekly"
											? "weeklyHolidayLabel"
											: "specificDate",
									)}
								</div>
								<div className="text-muted-foreground">
									{holiday.type === "weekly"
										? `${t("dayOfWeekLabel")}: ${holiday.weeklyDay !== null && holiday.weeklyDay >= 0 && holiday.weeklyDay <= 6 ? t(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][holiday.weeklyDay] as TranslationKey) : "-"}`
										: `${t("date")}: ${holiday.specificDate || "-"}`}
								</div>
							</div>
							<Badge variant="secondary">
								{t("holidayLabel")} #{holiday.id}
							</Badge>
						</CardContent>
					</Card>
				))}
			</div>

			{holidays?.length === 0 && (
				<Card>
					<CardContent className="p-8 text-center">
						<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<p className="font-semibold text-lg text-muted-foreground">
							{t("noHolidays")}
						</p>
						<p className="mt-2 text-muted-foreground text-sm">
							{t("noHolidaysDescription")}
						</p>
					</CardContent>
				</Card>
			)}

			{/* 다이얼로그 */}
			<HolidayDialog
				open={isHolidayDialogOpen}
				onOpenChange={setIsHolidayDialogOpen}
				editingHoliday={editingHoliday}
				holidayType={holidayType}
				onHolidayTypeChange={setHolidayType}
				onSubmit={handleHolidaySubmit}
			/>
		</div>
	);
}
