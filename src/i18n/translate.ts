import {getLanguage} from "./languageStore";
import {Translation, translations} from "./index";

type TranslationPath = Array<string | number | symbol>;

const proxyCache = new Map<string, unknown>();

const resolvePath = (path: TranslationPath): unknown => {
    let value: unknown = translations[getLanguage()];

    for (const segment of path) {
        if (typeof segment === "symbol") {
            return undefined;
        }

        value = (value as Record<string | number, unknown>)?.[segment];
    }

    return value;
};

const createProxy = (path: TranslationPath = []): unknown => {
    const cacheKey = path.join(".");
    const cached = proxyCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const proxy = new Proxy({}, {
        get(_, property) {
            if (property === Symbol.toPrimitive) {
                return () => String(resolvePath(path) ?? "");
            }

            if (property === "toString") {
                return () => String(resolvePath(path) ?? "");
            }

            if (property === "valueOf") {
                return () => resolvePath(path);
            }

            const nextPath = path.concat(property);
            const value = resolvePath(nextPath);

            if (value && typeof value === "object" && !Array.isArray(value)) {
                return createProxy(nextPath);
            }

            return value;
        },
        ownKeys() {
            const value = resolvePath(path);
            return value && typeof value === "object" ? Reflect.ownKeys(value) : [];
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true,
            };
        },
    });

    proxyCache.set(cacheKey, proxy);
    return proxy;
};

const translate = createProxy() as Translation;

export default translate;
