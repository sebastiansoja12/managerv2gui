import {pl} from "./pl";
import en from "./en";
import de from "./de";

export const translations = {
    pl,
    en,
    de,
};

export type Language = keyof typeof translations;
export type Translation = typeof pl;

export const defaultLanguage: Language = "pl";
