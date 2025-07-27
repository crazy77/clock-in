import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
	BarChart3,
	Calendar,
	Home,
	LogOut,
	Settings,
	User,
	Users,
} from "lucide-react";
import Image from "next/image";
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

					<div className="flex items-center">
						<div className=" text-sm ">
							<div className="flex items-center gap-2">
								{sessionData.user.image ? (
									<Image
										src={sessionData.user.image}
										alt="User"
										width={20}
										height={20}
										className="rounded-full"
									/>
								) : (
									<User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
								)}
								<span className="text-gray-600 text-sm dark:text-gray-300">
									{sessionData.user.name}
								</span>
							</div>
						</div>

						<Button variant="ghost" size="sm" onClick={() => signOut()}>
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
