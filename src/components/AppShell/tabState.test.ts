import {
    addTab,
    closeOtherTabs,
    closeTabsToRight,
    closeUnpinnedTabs,
    normalizeTabFlags,
    removeTab,
    togglePinnedTab,
    trimTabs,
} from "./tabState";
import {AppTabDefinition} from "./types";

const tab = (path: string, flags: Partial<AppTabDefinition> = {}): AppTabDefinition => ({label: path, path, ...flags});
const paths = (tabs: AppTabDefinition[]) => tabs.map((current) => current.path);

describe("tabState", () => {
    it("opens every new page in its own tab next to the previous ones", () => {
        const tabs = [tab("/"), tab("/global-configuration")];

        expect(paths(addTab(addTab(tabs, tab("/depots")), tab("/pallets"))))
            .toEqual(["/", "/global-configuration", "/depots", "/pallets"]);
    });

    it("only activates a page that is already open", () => {
        const tabs = [tab("/"), tab("/chat")];

        expect(addTab(tabs, tab("/chat"))).toBe(tabs);
        expect(addTab(tabs, tab("/"))).toBe(tabs);
    });

    it("keeps the home tab first and open", () => {
        const tabs = [tab("/"), tab("/a"), tab("/b")];

        expect(paths(removeTab(tabs, "/"))).toEqual(["/", "/a", "/b"]);
        expect(paths(closeOtherTabs(tabs, "/b"))).toEqual(["/", "/b"]);
        expect(paths(closeUnpinnedTabs(tabs))).toEqual(["/"]);
        expect(togglePinnedTab(tabs, "/")).toBe(tabs);
    });

    it("drops the least recently used closable tab above the limit", () => {
        const tabs = [tab("/"), tab("/a", {pinned: true}), tab("/b"), tab("/c"), tab("/d")];

        expect(paths(trimTabs(tabs, "/d", ["/", "/a", "/c", "/b"], 4))).toEqual(["/", "/a", "/b", "/d"]);
    });

    it("moves pinned tabs right after the home tab", () => {
        expect(togglePinnedTab([tab("/"), tab("/a"), tab("/chat")], "/chat")).toEqual([
            tab("/"),
            tab("/chat", {pinned: true}),
            tab("/a"),
        ]);
    });

    it("keeps pinned tabs when closing other, right-hand or all tabs", () => {
        const tabs = [tab("/"), tab("/pinned", {pinned: true}), tab("/a"), tab("/b"), tab("/c")];

        expect(paths(closeOtherTabs(tabs, "/b"))).toEqual(["/", "/pinned", "/b"]);
        expect(paths(closeTabsToRight(tabs, "/a"))).toEqual(["/", "/pinned", "/a"]);
        expect(paths(closeUnpinnedTabs(tabs))).toEqual(["/", "/pinned"]);
    });

    it("repairs stored tabs: home first, pinned next and no legacy preview flag", () => {
        expect(normalizeTabFlags([
            {...tab("/a"), preview: true} as AppTabDefinition,
            tab("/b", {pinned: true}),
            tab("/", {pinned: true}),
        ])).toEqual([
            tab("/"),
            tab("/b", {pinned: true}),
            tab("/a"),
        ]);
    });
});
