import React from "react";
import {IconButton} from "components/ui";
import {Edit} from "components/ui/icons";
import pl from "../../i18n/translate";

export type EditableFieldRow = {
    key: string;
    label: string;
    value?: string | null;
    onEdit?: () => void;
};

function EditableFieldList({rows}: {rows: EditableFieldRow[]}) {
    return (
        <dl className="carrier-field-list">
            {rows.map((row) => (
                <div key={row.key}>
                    <dt>{row.label}</dt>
                    <dd>
                        <span>{row.value || pl.common.dash}</span>
                        {row.onEdit ? (
                            <IconButton
                                aria-label={pl.carriers.fieldEdit.edit.replace("{field}", row.label)}
                                size="small"
                                title={pl.carriers.fieldEdit.edit.replace("{field}", row.label)}
                                onClick={row.onEdit}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        ) : null}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default EditableFieldList;
