import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "~/lib/i18n";
import type { RouterOutputs } from "~/utils/api";
import { TimePicker } from "./TimePicker";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Label } from "./label";

type UserTimeCardSetting =
	RouterOutputs["attendance"]["getDefaultTimes"][number];

interface UserTimeCardProps {
	setting: UserTimeCardSetting;
	onUpdate: (clockInTime: string, clockOutTime: string) => void;
}

export function UserTimeCard({ setting, onUpdate }: UserTimeCardProps) {
	const { t } = useTranslation();
	const [clockInTime, setClockInTime] = useState(setting.defaultClockInTime);
	const [clockOutTime, setClockOutTime] = useState(setting.defaultClockOutTime);

	const handleSave = () => {
		onUpdate(clockInTime, clockOutTime);
	};

	return (
		<Card className="py-3">
			<CardContent className="">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-1 items-center ">
						<div className="flex flex-1 items-center gap-2">
							{setting.image ? (
								<Image
									src={setting.image}
									alt="User"
									width={20}
									height={20}
									className="rounded-full"
								/>
							) : (
								<User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
							)}
							<h3 className="font-semibold text-base sm:text-lg">
								{setting.name || setting.email || "Unknown User"}
							</h3>
						</div>

						<div className="flex items-center">
							<div className="flex items-center">
								<Label className="text-muted-foreground text-sm">
									{t("clockIn")}
								</Label>
								<TimePicker value={clockInTime} onChange={setClockInTime} />
							</div>
							<div className="flex items-center ">
								<Label className="text-muted-foreground text-sm">
									{t("clockOut")}
								</Label>
								<TimePicker value={clockOutTime} onChange={setClockOutTime} />
							</div>
						</div>
					</div>

					<Button
						size="default"
						onClick={handleSave}
						className="flex-1 sm:flex-none"
					>
						{t("save")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
