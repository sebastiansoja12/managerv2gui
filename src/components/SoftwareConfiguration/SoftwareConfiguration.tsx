import React, {useState} from 'react';
import {
    Button,
    createTheme, makeStyles,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ThemeProvider
} from '@mui/material';
import Software from "./model/Software";


const useStyles = makeStyles({
    tableContainer: {
        maxWidth: '80%', // Set the maximum width of the table container
        margin: 'auto', // Center the table
    },
    table: {
        minWidth: 400, // Set the minimum width of the table
    },
    button: {
        textTransform: 'none',
    },
});

interface SoftwarePropertiesListProps {
    softwareProperties: Software[];
    onUpdate: (id: string, category: string, name: string, value: string) => void;
}



const SoftwarePropertiesList: React.FC<SoftwarePropertiesListProps> = ({softwareProperties, onUpdate}) => {
    const [editableFields, setEditableFields] = useState<{
        [key: string]: { name: string, category: string, value: string }
    }>({});

    const handleFieldChange = (id: string, field: string, value: string) => {
        setEditableFields((prevFields) => ({
            ...prevFields,
            [id]: {
                ...prevFields[id],
                [field]: value
            }
        }));
    };

    const handleUpdateClick = (property: Software) => {
        const {id, category, name} = property;
        const updatedFields = editableFields[id] || {};

        onUpdate(id, updatedFields.category || category, updatedFields.name || name, updatedFields.value || property.value);
        setEditableFields((prevFields) => ({...prevFields, [id]: {} as any}));
    };

    const theme = createTheme({
        components: {
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: '1px solid rgba(224, 224, 224, 1)',
                        padding: '8px', // Adjust cell padding
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                    },
                },
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <TableContainer component={Paper} >
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
                                        color="primary"
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
