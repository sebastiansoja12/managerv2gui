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
import pl from "../../i18n/translate";

const recordShipmentId = (record: RouteLogRecord) => record.parcelId?.value || record.shipmentId?.value || pl.common.dash;

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
                <TableCell>{recordShipmentId(record)}</TableCell>
                <TableCell>{record.returnCode.value}</TableCell>
                <TableCell>{record.faultDescription.value}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{pl.routeLogs.columns.id}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.zebraId}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.zebraVersion}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.username}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.depotCode}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.parcelStatus}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.description}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.timestamp}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.processType}</TableCell>
                                    <TableCell>{pl.routeLogs.columns.request}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {record.routeLogRecordDetails.routeLogRecordDetailSet.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>{detail.id}</TableCell>
                                        <TableCell>{detail.zebraId || detail.terminalId?.value || pl.common.dash}</TableCell>
                                        <TableCell>{detail.version}</TableCell>
                                        <TableCell>{detail.username}</TableCell>
                                        <TableCell>{detail.depotCode}</TableCell>
                                        <TableCell>{detail.parcelStatus || detail.shipmentStatus}</TableCell>
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
            recordShipmentId(record).toString().toLowerCase().includes(searchTermLower)
        );
    };

    const filteredRecords = filterRecords();

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom>
                {pl.routeLogs.title}
            </Typography>

            <TextField
                label={pl.routeLogs.searchByShipmentId}
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
                            <TableCell>{pl.routeLogs.columns.shipmentId}</TableCell>
                            <TableCell>{pl.routeLogs.columns.returnCode}</TableCell>
                            <TableCell>{pl.routeLogs.columns.faultDescription}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRecords.map((record) => (
                            <Row key={recordShipmentId(record)} record={record} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default RouteLogRecordTable;
