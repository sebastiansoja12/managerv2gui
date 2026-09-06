import React, { useState } from 'react';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "components/ui";
import Software from './model/Software';
import pl from "../../i18n/translate";

interface SoftwarePropertiesListProps {
    softwareProperties: Software[];
    onUpdate: (id: string, category: string, name: string, value: string) => void;
}

const SoftwarePropertiesList: React.FC<SoftwarePropertiesListProps> = ({ softwareProperties, onUpdate }) => {
    const [editableFields, setEditableFields] = useState<{ [key: string]: { name: string, category: string, value: string } }>({});

    const handleFieldChange = (id: string, field: string, value: string) => {
        setEditableFields((prevFields) => ({
            ...prevFields,
            [id]: {
                ...prevFields[id],
                [field]: value,
            },
        }));
    };

    const handleUpdateClick = (property: Software) => {
        const { id, category, name } = property;
        const updatedFields = editableFields[id] || {};

        onUpdate(id, updatedFields.category || category, updatedFields.name || name, updatedFields.value || property.value);
        setEditableFields((prevFields) => ({ ...prevFields, [id]: {} as any }));
    };

    return (
        <TableContainer className="software-configuration-panel" component={Paper}>
            <Table className="software-configuration-table">
                <TableHead>
                    <TableRow>
                        <TableCell>{pl.softwareConfiguration.columns.id}</TableCell>
                        <TableCell>{pl.softwareConfiguration.columns.name}</TableCell>
                        <TableCell>{pl.softwareConfiguration.columns.category}</TableCell>
                        <TableCell>{pl.softwareConfiguration.columns.value}</TableCell>
                        <TableCell>{pl.softwareConfiguration.columns.action}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {softwareProperties.map((property) => (
                        <TableRow key={property.id}>
                            <TableCell>{property.id}</TableCell>
                            <TableCell>
                                <TextField
                                    value={editableFields[property.id]?.name || property.name}
                                    onChange={(e) => handleFieldChange(property.id, 'name', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    value={editableFields[property.id]?.category || property.category}
                                    onChange={(e) => handleFieldChange(property.id, 'category', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    value={editableFields[property.id]?.value || property.value}
                                    onChange={(e) => handleFieldChange(property.id, 'value', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    className="software-configuration-save"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleUpdateClick(property)}
                                >
                                    {pl.softwareConfiguration.actions.update}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default SoftwarePropertiesList;
