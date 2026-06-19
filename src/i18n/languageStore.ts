import {defaultLanguage, Language, translations} from "./index";

const GLOBAL_LANGUAGE_KEY = "manager.language";
const USER_LANGUAGE_PREFIX = "manager.language.user.";

let currentUserKey: string | null = null;
let currentLanguage: Language = defaultLanguage;

const listeners = new Set<(language: Language) => void>();

const normalizeLanguage = (value?: string | null): Language => (
    value && value in translations ? value as Language : defaultLanguage
);

const userStorageKey = (userKey: string) => `${USER_LANGUAGE_PREFIX}${userKey}`;

const readStoredLanguage = (userKey?: string | null): Language => {
    if (userKey) {
        const userLanguage = localStorage.getItem(userStorageKey(userKey));
        if (userLanguage) {
            return normalizeLanguage(userLanguage);
        }
    }

    return normalizeLanguage(localStorage.getItem(GLOBAL_LANGUAGE_KEY));
};

const persistLanguage = (language: Language) => {
    localStorage.setItem(GLOBAL_LANGUAGE_KEY, language);

    if (currentUserKey) {
        localStorage.setItem(userStorageKey(currentUserKey), language);
    }
};

const notify = () => {
    listeners.forEach((listener) => listener(currentLanguage));
};

export const getLanguage = () => currentLanguage;

export const setLanguage = (language: Language) => {
    const nextLanguage = normalizeLanguage(language);
    currentLanguage = nextLanguage;
    persistLanguage(nextLanguage);
    notify();
};

export const setCurrentUserLanguageContext = (userKey: string, language?: string | null) => {
    currentUserKey = userKey;
    currentLanguage = language ? normalizeLanguage(language) : readStoredLanguage(userKey);
    persistLanguage(currentLanguage);
    notify();
};

export const clearCurrentUserLanguageContext = () => {
    currentUserKey = null;
};

export const subscribeLanguage = (listener: (language: Language) => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

currentLanguage = readStoredLanguage();
