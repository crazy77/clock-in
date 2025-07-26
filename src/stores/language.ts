import { atomWithStorage } from "jotai/utils";

export type Language = "ko" | "en";

export const languageAtom = atomWithStorage<Language>("language", "ko");
