import React, { useState } from 'react';
import { Button, createTheme, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ThemeProvider } from '@mui/material';
import Software from './model/Software';

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

    const theme = createTheme();

    return (
        <ThemeProvider theme={theme}>
            <TableContainer component={Paper} sx={{ maxWidth: '80%', margin: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Action</TableCell>
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
                                        variant="contained"
                                        color="info"
                                        onClick={() => handleUpdateClick(property)}
                                    >
                                        Update
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </ThemeProvider>
    );
};

export default SoftwarePropertiesList;
