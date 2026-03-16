export type GlobalConfigurationSectionKey = "suppliers" | "shipments" | "configuration";

export type GlobalConfigurationSection = {
    key: GlobalConfigurationSectionKey;
    categoryAliases: string[];
};

