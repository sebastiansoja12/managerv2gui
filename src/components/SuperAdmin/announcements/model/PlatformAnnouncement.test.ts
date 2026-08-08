import {announcementToDraft, draftToRequest, emptyAnnouncementDraft, isDraftRangeInvalid, toDateTimeLocal} from "./PlatformAnnouncement";

describe("PlatformAnnouncement helpers", () => {
    test("maps empty dates to open validity", () => {
        const request = draftToRequest({...emptyAnnouncementDraft(), message: "  Informacja  "});

        expect(request.message).toBe("Informacja");
        expect(request.validFrom).toBeNull();
        expect(request.validTo).toBeNull();
        expect(request.targetOperatorIds).toEqual([]);
    });

    test("round-trips validity dates through the editor format", () => {
        const draft = announcementToDraft({
            id: 1,
            message: "Przestój",
            severity: "WARNING",
            status: "SCHEDULED",
            validFrom: "2026-10-17T20:00:00.000Z",
            validTo: null,
            targetOperatorIds: [20],
            targetRoles: ["ADMIN"],
        });

        expect(draft.validFrom).toBe(toDateTimeLocal("2026-10-17T20:00:00.000Z"));
        expect(draftToRequest(draft).validFrom).toBe("2026-10-17T20:00:00.000Z");
        expect(draft.targetOperatorIds).toEqual([20]);
    });

    test("detects end before start", () => {
        expect(isDraftRangeInvalid({...emptyAnnouncementDraft(), validFrom: "2026-10-17T22:00", validTo: "2026-10-17T20:00"})).toBe(true);
        expect(isDraftRangeInvalid({...emptyAnnouncementDraft(), validFrom: "2026-10-17T20:00", validTo: "2026-10-17T22:00"})).toBe(false);
        expect(isDraftRangeInvalid({...emptyAnnouncementDraft(), validTo: "2026-10-17T22:00"})).toBe(false);
    });
});
