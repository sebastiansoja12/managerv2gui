import pl from "../i18n/translate";

export async function copyText(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value);
            return;
        } catch {
            // Some browsers expose the API but deny access to it.
        }
    }

    const activeElement = document.activeElement;
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.readOnly = true;
    textArea.tabIndex = -1;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    try {
        textArea.focus();
        textArea.select();
        // HTTP pages can lack Clipboard API; keep the legacy path as a fallback.
        if (!document.execCommand("copy")) {
            throw new Error(pl.common.copyError);
        }
    } catch {
        throw new Error(pl.common.copyError);
    } finally {
        textArea.value = "";
        textArea.remove();
        if (activeElement instanceof HTMLElement) {
            activeElement.focus({preventScroll: true});
        }
    }
}
