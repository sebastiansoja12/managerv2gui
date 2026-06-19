import React from "react";
import {Construction} from "@mui/icons-material";
import pl from "../../i18n/translate";
import "./styles/home-dashboard.css";

type ModulePlaceholderProps = {
    forbidden?: boolean;
    title: string;
};

function ModulePlaceholder({forbidden = false, title}: ModulePlaceholderProps) {
    return (
        <main className="module-placeholder-page">
            <section className="module-placeholder-panel">
                <span className="module-placeholder-icon">
                    <Construction fontSize="small" />
                </span>
                <span className="home-dashboard-kicker">{pl.modules.placeholder.kicker}</span>
                <h1>{forbidden ? pl.modules.placeholder.forbiddenTitle : `${title} ${pl.modules.placeholder.titleSuffix}`}</h1>
                <p>{forbidden ? pl.modules.placeholder.forbiddenDescription : pl.modules.placeholder.description}</p>
            </section>
        </main>
    );
}

export default ModulePlaceholder;
