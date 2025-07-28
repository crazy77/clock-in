import { Building2, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { WorkplaceDialog } from "~/components/admin/WorkplaceDialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useTranslation } from "~/lib/i18n";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Workplaces = RouterOutputs["attendance"]["getWorkplaces"];

export function WorkplacesTab() {
	const { t } = useTranslation();
	const [isWorkplaceDialogOpen, setIsWorkplaceDialogOpen] = useState(false);
	const [editingWorkplace, setEditingWorkplace] = useState<
		Workplaces[number] | null
	>(null);

	// 출퇴근 장소 목록 조회
	const { data: workplaces, refetch: refetchWorkplaces } =
		api.attendance.getWorkplaces.useQuery();

	// 출퇴근 장소 추가/수정/삭제 뮤테이션
	const createWorkplaceMutation = api.attendance.createWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
			setIsWorkplaceDialogOpen(false);
			toast.success(t("workplaceCreated"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateWorkplaceMutation = api.attendance.updateWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
			setIsWorkplaceDialogOpen(false);
			setEditingWorkplace(null);
			toast.success(t("workplaceUpdated"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const deleteWorkplaceMutation = api.attendance.deleteWorkplace.useMutation({
		onSuccess: () => {
			refetchWorkplaces();
			toast.success(t("workplaceDeleted"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleWorkplaceSubmit = (formData: FormData) => {
		const name = formData.get("name") as string;
		const latitude = Number(formData.get("latitude"));
		const longitude = Number(formData.get("longitude"));
		const radius = Number(formData.get("radius"));

		if (editingWorkplace) {
			updateWorkplaceMutation.mutate({
				id: editingWorkplace.id,
				name,
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				radius,
			});
		} else {
			createWorkplaceMutation.mutate({
				name,
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				radius,
			});
		}
	};

	const handleEditWorkplace = (workplace: Workplaces[number]) => {
		setEditingWorkplace(workplace);
		setIsWorkplaceDialogOpen(true);
	};

	const handleDeleteWorkplace = (id: number) => {
		if (confirm(t("confirmDeleteWorkplace"))) {
			deleteWorkplaceMutation.mutate({ id });
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">{t("workplaceSettings")}</h2>
					<p className="text-muted-foreground text-sm">
						{t("workplaceSettingsDescription")}
					</p>
				</div>
				<Button onClick={() => setIsWorkplaceDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("addWorkplace")}
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{workplaces?.map((workplace) => (
					<Card key={workplace.id}>
						<CardHeader className="">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center space-x-2 text-base">
									<Building2 className="h-4 w-4" />
									<span>{workplace.name}</span>
								</CardTitle>
								<div className="flex space-x-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEditWorkplace(workplace)}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteWorkplace(workplace.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-sm">
								<div className="text-muted-foreground">
									{t("address")}: {workplace.address}
								</div>
								<div className="text-muted-foreground">
									{t("latitude")}: {Number(workplace.latitude).toFixed(6)},{" "}
									{t("longitude")}: {Number(workplace.longitude).toFixed(6)}
								</div>
								<div className="text-muted-foreground">
									{t("radius")}: {workplace.radius}m
								</div>
							</div>
							<Badge variant="secondary">
								{t("workplaceSettings")} #{workplace.id}
							</Badge>
						</CardContent>
					</Card>
				))}
			</div>

			{workplaces?.length === 0 && (
				<Card>
					<CardContent className="p-8 text-center">
						<Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<p className="font-semibold text-lg text-muted-foreground">
							{t("noWorkplaces")}
						</p>
						<p className="mt-2 text-muted-foreground text-sm">
							{t("noWorkplacesDescription")}
						</p>
					</CardContent>
				</Card>
			)}

			{/* 다이얼로그 */}
			<WorkplaceDialog
				open={isWorkplaceDialogOpen}
				onOpenChange={setIsWorkplaceDialogOpen}
				editingWorkplace={editingWorkplace}
				onSubmit={handleWorkplaceSubmit}
			/>
		</div>
	);
}
