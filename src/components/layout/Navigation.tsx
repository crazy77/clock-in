import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import { 
	Calendar, 
	BarChart3, 
	Settings, 
	Users, 
	Home,
	LogOut
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTranslation } from "~/lib/i18n";

const navigationItems = [
	{ href: "/", label: "home", icon: Home },
	{ href: "/records", label: "attendanceRecords", icon: Calendar },
	{ href: "/statistics", label: "statistics", icon: BarChart3 },
	{ href: "/admin", label: "adminPanel", icon: Users },
];

export function Navigation() {
	const { data: sessionData } = useSession();
	const { t } = useTranslation();
	const router = useRouter();

	if (!sessionData?.user) {
		return null;
	}

	return (
		<nav className="bg-background border-b">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center space-x-8">
						<Link href="/" className="flex items-center space-x-2">
							<Calendar className="h-6 w-6" />
							<span className="font-bold text-lg">Clock In</span>
						</Link>

						<div className="hidden md:flex items-center space-x-1">
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
						<div className="hidden md:block text-sm">
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