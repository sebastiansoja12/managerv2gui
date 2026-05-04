export type GlobalConfigurationSectionKey = "suppliers" | "shipments" | "configuration" | "geocoding";

export type GlobalConfigurationSection = {
    key: GlobalConfigurationSectionKey;
    categoryAliases: string[];
};
