// src/i18n/index.ts
import pl from "./pl";
import en from "./en";

export const translations = {
    pl,
    en,
};

export type Language = keyof typeof translations;
export type Translation = typeof pl;

export const defaultLanguage: Language = "pl";