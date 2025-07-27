import { Building } from "lucide-react";
import { useState } from "react";

import MapSetting from "~/components/MapSetting";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTranslation } from "~/lib/i18n";
import type { RouterOutputs } from "~/utils/api";

type Workplaces = RouterOutputs["attendance"]["getWorkplaces"];

interface WorkplaceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingWorkplace: Workplaces[number] | null;
	onSubmit: (formData: FormData) => void;
}

export function WorkplaceDialog({
	open,
	onOpenChange,
	editingWorkplace,
	onSubmit,
}: WorkplaceDialogProps) {
	const { t } = useTranslation();
	const [latitude, setLatitude] = useState(
		Number(editingWorkplace?.latitude) || 37.5665,
	);
	const [longitude, setLongitude] = useState(
		Number(editingWorkplace?.longitude) || 126.978,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<Building className="h-5 w-5" />
						<span>
							{editingWorkplace ? t("editWorkplace") : t("addWorkplace")}
						</span>
					</DialogTitle>
				</DialogHeader>
				<form action={onSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">{t("workplaceName")}</Label>
						<Input
							id="name"
							name="name"
							defaultValue={editingWorkplace?.name || ""}
							required
						/>
					</div>
					<div>
						<Label>{t("currentLocation")}</Label>
						<MapSetting
							initialLat={Number(editingWorkplace?.latitude)}
							initialLng={Number(editingWorkplace?.longitude)}
							onLocationChange={(lat, lng) => {
								setLatitude(lat);
								setLongitude(lng);
							}}
						/>
						<input type="hidden" name="latitude" value={latitude} />
						<input type="hidden" name="longitude" value={longitude} />
						<input type="hidden" name="radius" value={100} />
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
							{editingWorkplace ? t("save") : t("add")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
