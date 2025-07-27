import { useSession } from "next-auth/react";
import Head from "next/head";

import {
	HolidaysTab,
	MonthlyRecordsTab,
	TimeSettingsTab,
	TodayStatusTab,
	WorkplacesTab,
} from "~/components/admin";
import { AdminGuard } from "~/components/ui/AdminGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTranslation } from "~/lib/i18n";

export default function AdminPage() {
	return (
		<AdminGuard>
			<AdminPageContent />
		</AdminGuard>
	);
}

function AdminPageContent() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();

	if (!sessionData?.user) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex h-64 items-center justify-center">
					<div className="text-lg">{t("loading")}</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{t("adminPanel")} - Clock In</title>
			</Head>

			<div className="container mx-auto max-w-6xl p-4">
				<div className="mb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="font-bold text-2xl">{t("adminPanel")}</h1>
							<p className="mt-1 text-muted-foreground">
								{t("adminPanelDescription")}
							</p>
						</div>
					</div>
				</div>

				<Tabs defaultValue="today" className="w-full space-y-6">
					<TabsList className="w-full">
						<TabsTrigger value="today">{t("todayStatus")}</TabsTrigger>
						<TabsTrigger value="monthly">{t("monthlyRecords")}</TabsTrigger>
						<TabsTrigger value="workplaces">
							{t("workplaceSettings")}
						</TabsTrigger>
						<TabsTrigger value="times">{t("timeSettings")}</TabsTrigger>
						<TabsTrigger value="holidays">{t("holidays")}</TabsTrigger>
					</TabsList>

					<TabsContent value="today" className="space-y-4">
						<TodayStatusTab />
					</TabsContent>

					<TabsContent value="monthly" className="space-y-4">
						<MonthlyRecordsTab />
					</TabsContent>

					<TabsContent value="workplaces" className="space-y-4">
						<WorkplacesTab />
					</TabsContent>

					<TabsContent value="times" className="space-y-6">
						<TimeSettingsTab />
					</TabsContent>

					<TabsContent value="holidays" className="space-y-4">
						<HolidaysTab />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
