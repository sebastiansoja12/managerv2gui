import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {PageDto, ProcessLogDto} from "../components/Process/dto/ProcessLogDto";

const client = new BackendClient(http);

const getAll = (page = 0, size = 20) => client.get<PageDto<ProcessLogDto>>("/process-logs", {
    params: {
        page,
        size,
    },
});

const get = (processId: string) => client.get<ProcessLogDto>(`/process-logs/${processId}`);

const ProcessLogService = {
    getAll,
    get,
};

export default ProcessLogService;
