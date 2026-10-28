import {
    closeOtherTabs,
    closeTabsToRight,
    closeUnpinnedTabs,
    keepTab,
    normalizeTabFlags,
    openPreviewTab,
    togglePinnedTab,
    trimTabs,
} from "./tabState";
import {AppTabDefinition} from "./types";

const tab = (path: string, flags: Partial<AppTabDefinition> = {}): AppTabDefinition => ({label: path, path, ...flags});

describe("tabState", () => {
    it("appends a new page as the preview tab", () => {
        expect(openPreviewTab([tab("/")], tab("/chat"))).toEqual([tab("/"), tab("/chat", {preview: true})]);
    });

    it("replaces the current preview tab instead of adding another one", () => {
        const tabs = [tab("/"), tab("/chat", {preview: true}), tab("/processes")];

        expect(openPreviewTab(tabs, tab("/pallets"))).toEqual([
            tab("/"),
            tab("/pallets", {preview: true}),
            tab("/processes"),
        ]);
    });

    it("only activates a page that is already open", () => {
        const tabs = [tab("/"), tab("/chat", {preview: true})];

        expect(openPreviewTab(tabs, tab("/"))).toBe(tabs);
    });

    it("keeps a preview tab so the next page opens next to it", () => {
        const tabs = keepTab([tab("/"), tab("/chat", {preview: true})], "/chat");

        expect(tabs).toEqual([tab("/"), tab("/chat", {preview: false})]);
        expect(openPreviewTab(tabs, tab("/pallets"))).toHaveLength(3);
    });

    it("drops the least recently used unpinned tab above the limit", () => {
        const tabs = [tab("/a", {pinned: true}), tab("/b"), tab("/c"), tab("/d")];

        expect(trimTabs(tabs, "/d", ["/a", "/c", "/b"], 3).map((current) => current.path))
            .toEqual(["/a", "/b", "/d"]);
    });

    it("moves pinned tabs to the front and never keeps them as preview", () => {
        expect(togglePinnedTab([tab("/"), tab("/chat", {preview: true})], "/chat")).toEqual([
            tab("/chat", {pinned: true, preview: false}),
            tab("/"),
        ]);
    });

    it("keeps pinned tabs when closing other, right-hand or all tabs", () => {
        const tabs = [tab("/pinned", {pinned: true}), tab("/a"), tab("/b"), tab("/c")];

        expect(closeOtherTabs(tabs, "/b").map((current) => current.path)).toEqual(["/pinned", "/b"]);
        expect(closeTabsToRight(tabs, "/a").map((current) => current.path)).toEqual(["/pinned", "/a"]);
        expect(closeUnpinnedTabs(tabs).map((current) => current.path)).toEqual(["/pinned"]);
    });

    it("repairs stored flags: pinned first and a single preview tab", () => {
        expect(normalizeTabFlags([
            tab("/a", {preview: true}),
            tab("/b", {pinned: true, preview: true}),
            tab("/c", {preview: true}),
        ])).toEqual([
            tab("/b", {pinned: true}),
            tab("/a", {preview: true}),
            tab("/c"),
        ]);
    });
});
