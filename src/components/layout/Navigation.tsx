import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
	BarChart3,
	Calendar,
	Home,
	LogOut,
	Settings,
	Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTranslation } from "~/lib/i18n";

const navigationItems = [
	{ href: "/", label: "home" as const, icon: Home },
	{ href: "/records", label: "attendanceRecords" as const, icon: Calendar },
	{ href: "/statistics", label: "statistics" as const, icon: BarChart3 },
	{ href: "/admin", label: "adminPanel" as const, icon: Users },
];

export function Navigation() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const router = useRouter();

	if (!sessionData?.user) {
		return null;
	}

	return (
		<nav className="border-b bg-background">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center space-x-8">
						<Link href="/" className="flex items-center space-x-2">
							<Calendar className="h-6 w-6" />
							<span className="font-bold text-lg">Clock In</span>
						</Link>

						<div className="hidden items-center space-x-1 md:flex">
							{navigationItems.map((item) => {
								const Icon = item.icon;
								const isActive = router.pathname === item.href;

								return (
									<Link key={item.href} href={item.href}>
										<Button
											variant={isActive ? "default" : "ghost"}
											size="sm"
											className="flex items-center space-x-2"
										>
											<Icon className="h-4 w-4" />
											<span>{t(item.label)}</span>
										</Button>
									</Link>
								);
							})}
						</div>
					</div>

					<div className="flex items-center space-x-4">
						<div className="hidden text-sm md:block">
							<span className="text-muted-foreground">
								{sessionData.user.name || sessionData.user.email}
							</span>
						</div>

						<Button variant="ghost" size="sm" asChild>
							<Link href="/api/auth/signout">
								<LogOut className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
