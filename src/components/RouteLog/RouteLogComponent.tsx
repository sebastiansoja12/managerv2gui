import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    Container,
    IconButton,
    Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import RouteLogRecord from './model/RouteLogRecord';
const Row: React.FC<{ record: RouteLogRecord }> = ({ record }) => {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell>{record.parcelId.value}</TableCell>
                <TableCell>{record.returnCode.value}</TableCell>
                <TableCell>{record.faultDescription.value}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Zebra ID</TableCell>
                                    <TableCell>Zebra Version</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Depot Code</TableCell>
                                    <TableCell>Parcel Status</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Process Type</TableCell>
                                    <TableCell>Request</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {record.routeLogRecordDetails.routeLogRecordDetailSet.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>{detail.id}</TableCell>
                                        <TableCell>{detail.zebraId}</TableCell>
                                        <TableCell>{detail.version}</TableCell>
                                        <TableCell>{detail.username}</TableCell>
                                        <TableCell>{detail.depotCode}</TableCell>
                                        <TableCell>{detail.parcelStatus}</TableCell>
                                        <TableCell>{detail.description}</TableCell>
                                        <TableCell>{detail.timestamp}</TableCell>
                                        <TableCell>{detail.processType}</TableCell>
                                        <TableCell>{detail.request}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const RouteLogRecordTable: React.FC<{ data: Array<RouteLogRecord> }> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filterRecords = () => {
        if (!searchTerm) {
            return data;
        }
        const searchTermLower = searchTerm.toLowerCase();
        return data.filter((record) =>
            record.parcelId.value.toString().toLowerCase().includes(searchTermLower)
        );
    };

    const filteredRecords = filterRecords();

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom>
                Parcel Table
            </Typography>

            <TextField
                label="Search by Parcel ID"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Parcel ID</TableCell>
                            <TableCell>Return Code</TableCell>
                            <TableCell>Fault Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRecords.map((record) => (
                            <Row key={record.parcelId.value} record={record} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default RouteLogRecordTable;
