export type GlobalConfigurationSectionKey = "suppliers" | "shipments" | "configuration" | "geocoding" | "integrations";

export type GlobalConfigurationSection = {
    key: GlobalConfigurationSectionKey;
    categoryAliases: string[];
};
