import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark" | "system";

export const themeAtom = atomWithStorage<Theme>("theme", "system");

export const systemThemeAtom = atom<"light" | "dark">("light");

export const currentThemeAtom = atom((get) => {
	const theme = get(themeAtom);
	if (theme === "system") {
		return get(systemThemeAtom);
	}
	return theme;
});
