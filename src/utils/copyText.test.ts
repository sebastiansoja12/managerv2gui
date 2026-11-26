import pl from "../i18n/translate";
import {copyText} from "./copyText";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execCommandDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");
const execCommand = jest.fn();

beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: undefined});
    Object.defineProperty(document, "execCommand", {configurable: true, value: execCommand});
    execCommand.mockReset().mockReturnValue(true);
});

afterEach(() => {
    if (clipboardDescriptor) {
        Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
        Reflect.deleteProperty(navigator, "clipboard");
    }
    if (execCommandDescriptor) {
        Object.defineProperty(document, "execCommand", execCommandDescriptor);
    } else {
        Reflect.deleteProperty(document, "execCommand");
    }
    document.body.innerHTML = "";
});

test("uses Clipboard API when available", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: {writeText}});

    await copyText("secret");

    expect(writeText).toHaveBeenCalledWith("secret");
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")).toBeNull();
});

test("copies without Clipboard API, then removes the secret and restores focus", async () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    let temporaryField: HTMLTextAreaElement | null = null;
    execCommand.mockImplementation(() => {
        temporaryField = document.activeElement as HTMLTextAreaElement;
        expect(temporaryField.value).toBe("secret\nsecond line");
        expect(temporaryField.selectionStart).toBe(0);
        expect(temporaryField.selectionEnd).toBe(temporaryField.value.length);
        return true;
    });

    await copyText("secret\nsecond line");

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
    expect(temporaryField).toHaveValue("");
    expect(document.activeElement).toBe(button);
});

test("falls back when Clipboard API rejects the write", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: {writeText}});

    await copyText("secret");

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
});

test.each(["refused", "thrown", "unavailable"])("reports a translated error and cleans up when fallback is %s", async (failure) => {
    if (failure === "refused") {
        execCommand.mockReturnValue(false);
    } else if (failure === "thrown") {
        execCommand.mockImplementation(() => { throw new Error("Browser error"); });
    } else {
        Object.defineProperty(document, "execCommand", {configurable: true, value: undefined});
    }
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    await expect(copyText("secret")).rejects.toThrow(pl.common.copyError);

    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(button);
});
