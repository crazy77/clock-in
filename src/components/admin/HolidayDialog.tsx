import { Calendar } from "lucide-react";

import { DatePicker } from "~/components/ui/DatePicker";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import { Textarea } from "~/components/ui/textarea";
import { useTranslation } from "~/lib/i18n";
import type { RouterOutputs } from "~/utils/api";

type Holidays = RouterOutputs["attendance"]["getHolidays"];

interface HolidayDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingHoliday: Holidays[number] | null;
	holidayType: "weekly" | "specific_date";
	onHolidayTypeChange: (type: "weekly" | "specific_date") => void;
	onSubmit: (formData: FormData) => void;
}

export function HolidayDialog({
	open,
	onOpenChange,
	editingHoliday,
	holidayType,
	onHolidayTypeChange,
	onSubmit,
}: HolidayDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<Calendar className="h-5 w-5" />
						<span>{editingHoliday ? t("editHoliday") : t("addHoliday")}</span>
					</DialogTitle>
				</DialogHeader>
				<form action={onSubmit} className="space-y-4">
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
								onHolidayTypeChange(value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectHolidayType")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="weekly">{t("weeklyHoliday")}</SelectItem>
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
								defaultValue={editingHoliday?.weeklyDay?.toString() || "0"}
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
							onClick={() => onOpenChange(false)}
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
	);
}
