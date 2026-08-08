import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import pl from "../../i18n/translate";
import AnnouncementBanner from "./AnnouncementBanner";
import {readVisibleAnnouncements} from "./announcementStorage";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {userId: {value: 7}}}),
}));

jest.mock("./announcementStorage", () => {
    const actual = jest.requireActual("./announcementStorage");
    return {
        ...actual,
        readVisibleAnnouncements: jest.fn(),
    };
});

const readVisible = readVisibleAnnouncements as jest.Mock;

describe("AnnouncementBanner", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.sessionStorage.clear();
    });

    test("shows every visible announcement with its severity", async () => {
        readVisible.mockResolvedValue([
            {id: 1, title: "Przestój", message: "System niedostępny o 22:00", severity: "CRITICAL"},
            {id: 2, message: "Nowa wersja aplikacji", severity: "INFO"},
        ]);

        const {container} = render(<AnnouncementBanner />);

        expect(await screen.findByText("System niedostępny o 22:00")).toBeInTheDocument();
        expect(screen.getByText("Przestój")).toBeInTheDocument();
        expect(container.querySelector(".global-announcement-critical")).not.toBeNull();
        expect(container.querySelector(".global-announcement-info")).not.toBeNull();
    });

    test("does not allow dismissing critical announcement", async () => {
        readVisible.mockResolvedValue([{id: 1, message: "Awaria", severity: "CRITICAL"}]);

        render(<AnnouncementBanner />);

        await screen.findByText("Awaria");
        expect(screen.queryByRole("button", {name: pl.common.close})).not.toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    test("hides dismissed announcement for the session", async () => {
        readVisible.mockResolvedValue([{id: 5, message: "Informacja", severity: "INFO"}]);
        render(<AnnouncementBanner />);

        fireEvent.click(await screen.findByRole("button", {name: pl.common.close}));

        await waitFor(() => expect(screen.queryByText("Informacja")).not.toBeInTheDocument());
        expect(window.sessionStorage.getItem("manager:announcement-dismissed:7")).toBe("5");
    });
});
