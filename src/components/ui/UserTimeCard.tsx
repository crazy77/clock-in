import { Clock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "~/lib/i18n";
import { TimePicker } from "./TimePicker";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Label } from "./label";

interface UserTimeCardProps {
	setting: {
		userId: string;
		name: string | null;
		email: string | null;
		defaultClockInTime: string;
		defaultClockOutTime: string;
	};
	onUpdate: (userId: string, clockInTime: string, clockOutTime: string) => void;
}

export function UserTimeCard({ setting, onUpdate }: UserTimeCardProps) {
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
