import React from "react";
import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import AppRoutes from "./AppRoutes";
import {OperatorCapabilitiesContext} from "./OperatorCapabilitiesContext";

test.each(["/returns", "/returns/123"])("does not open %s when returns are unavailable", (path) => {
    render(
        <OperatorCapabilitiesContext.Provider value={{returnsStatus: "unavailable"}}>
            <MemoryRouter initialEntries={[path]}>
                <AppRoutes operationalProfile="warehouse" />
            </MemoryRouter>
        </OperatorCapabilitiesContext.Provider>,
    );

    expect(screen.getByText(pl.modules.placeholder.returnDisabledDescription)).toBeInTheDocument();
    expect(screen.queryByText(pl.returns.page.title)).not.toBeInTheDocument();
});
