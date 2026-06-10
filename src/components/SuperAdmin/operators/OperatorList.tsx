import React from "react";
import {Add, Business, Edit, Search} from "components/ui/icons";
import {Alert} from "components/ui";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {getOperatorIdValue} from "./operatorPanelUtils";

type OperatorListProps = {
    error: string;
    filteredOperators: Operator[];
    loading: boolean;
    query: string;
    selectedOperatorId: string;
    onCreate: () => void;
    onQueryChange: (query: string) => void;
    onSelect: (operator: Operator) => void;
};

function OperatorList({
    error,
    filteredOperators,
    loading,
    query,
    selectedOperatorId,
    onCreate,
    onQueryChange,
    onSelect,
}: OperatorListProps) {
    return (
        <article className="super-admin-panel super-admin-operator-list">
            <div className="super-admin-panel-header">
                <div>
                    <h2>{pl.superAdmin.list.title}</h2>
                    <span>{loading ? pl.superAdmin.list.loading : `${filteredOperators.length} ${pl.superAdmin.list.records}`}</span>
                </div>
                <div className="super-admin-search">
                    <Search fontSize="small"/>
                    <input
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        placeholder={pl.superAdmin.list.searchPlaceholder}
                        type="search"
                    />
                </div>
            </div>

            {error ? <Alert severity="error" sx={{mb: 2}}>{error}</Alert> : null}

            <div className="super-admin-table">
                <div className="super-admin-table-row super-admin-table-head">
                    <span>{pl.superAdmin.list.columns.operator}</span>
                    <span>{pl.superAdmin.list.columns.id}</span>
                    <span>{pl.superAdmin.list.columns.features}</span>
                    <span>{pl.superAdmin.list.columns.status}</span>
                    <span/>
                </div>

                {filteredOperators.map((operator) => {
                    const operatorId = getOperatorIdValue(operator);
                    const active = operatorId === selectedOperatorId;

                    return (
                        <button
                            className={`super-admin-table-row${active ? " super-admin-table-row-active" : ""}`}
                            key={operatorId}
                            onClick={() => onSelect(operator)}
                            type="button"
                        >
                            <span className="super-admin-operator-cell">
                                <span className="super-admin-avatar">{operator.companyName.slice(0, 2).toUpperCase()}</span>
                                <span>
                                    <strong>{operator.companyName}</strong>
                                    <small>{operator.contactEmail}</small>
                                </span>
                            </span>
                            <span>#{operatorId}</span>
                            <span className="super-admin-chip-group">
                                {operator.supportsLockers ? <small>{pl.superAdmin.list.chips.lockers}</small> : null}
                                {operator.supportsInternationalShipping ? <small>{pl.superAdmin.list.chips.international}</small> : null}
                                {operator.supportsCashOnDelivery ? <small>{pl.superAdmin.list.chips.cashOnDelivery}</small> : null}
                            </span>
                            <span className={`super-admin-status ${operator.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>
                                {operator.status === "ACTIVE" ? pl.superAdmin.editor.active : pl.superAdmin.editor.inactive}
                            </span>
                            <span className="super-admin-row-action">
                                <Edit fontSize="small"/>
                            </span>
                        </button>
                    );
                })}

                {!loading && !filteredOperators.length ? (
                    <div className="super-admin-empty-state">
                        <Business fontSize="large"/>
                        <strong>{pl.superAdmin.list.emptyTitle}</strong>
                        <span>{pl.superAdmin.list.emptyDescription}</span>
                        <button className="super-admin-primary-button" onClick={onCreate} type="button">
                            <Add fontSize="small"/>
                            <span>{pl.superAdmin.list.addOperator}</span>
                        </button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export default OperatorList;
