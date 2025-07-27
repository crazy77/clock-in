import { Provider } from "jotai";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppType } from "next/app";
import { Geist } from "next/font/google";
import { useEffect } from "react";

import { Navigation } from "~/components/layout/Navigation";
import { Toaster } from "~/components/ui/sonner";
import { languageAtom } from "~/stores/language";
import { currentThemeAtom, systemThemeAtom, themeAtom } from "~/stores/theme";
import { api } from "~/utils/api";

import "~/styles/globals.css";

const geist = Geist({
	subsets: ["latin"],
});

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	return (
		<Provider>
			<SessionProvider session={session}>
				<div className={geist.className}>
					<ThemeProvider />
					<Navigation />
					<Component {...pageProps} />
					<Toaster richColors />
				</div>
			</SessionProvider>
		</Provider>
	);
};

// 테마 프로바이더 컴포넌트
function ThemeProvider() {
	useEffect(() => {
		// 시스템 테마 감지
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
			const store = require("jotai").getDefaultStore();
			store.set(systemThemeAtom, e.matches ? "dark" : "light");
		};

		updateTheme(mediaQuery);
		mediaQuery.addEventListener("change", updateTheme);

		// 현재 테마를 DOM에 적용
		const applyTheme = () => {
			const store = require("jotai").getDefaultStore();
			const currentTheme = store.get(currentThemeAtom);

			// HTML 요소에 테마 클래스 적용
			const html = document.documentElement;
			html.classList.remove("light", "dark");
			html.classList.add(currentTheme);
		};

		// 초기 테마 적용
		applyTheme();

		// 테마 변경 감지
		const unsubscribe = require("jotai")
			.getDefaultStore()
			.sub(currentThemeAtom, () => {
				applyTheme();
			});

		return () => {
			mediaQuery.removeEventListener("change", updateTheme);
			unsubscribe();
		};
	}, []);

	return null;
}

export default api.withTRPC(MyApp);
