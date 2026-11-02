import pl from "../../i18n/translate";

type ProblemDetails = {
    properties?: {
        code?: unknown;
    };
};

export const deliveryAreaErrorMessage = (error: unknown, fallback: string) => {
    const labels = pl.departments.deliveryArea.errors;
    const code = (error as {details?: ProblemDetails} | null)?.details?.properties?.code;
    const message = typeof code === "string" ? labels[code as keyof typeof labels] : undefined;
    return typeof message === "string" ? message : fallback;
};
