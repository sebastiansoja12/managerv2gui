import http from "../http-super-admin";
import {
    PlatformAnnouncement,
    PlatformAnnouncementRequest,
} from "../components/SuperAdmin/announcements/model/PlatformAnnouncement";

const getAll = () => http.get<PlatformAnnouncement[]>("/platform/announcements").then((response) => response.data);

const create = (request: PlatformAnnouncementRequest) => (
    http.post<PlatformAnnouncement>("/platform/announcements", request).then((response) => response.data)
);

const update = (id: number, request: PlatformAnnouncementRequest) => (
    http.put<PlatformAnnouncement>(`/platform/announcements/${id}`, request).then((response) => response.data)
);

const remove = (id: number) => http.delete<void>(`/platform/announcements/${id}`).then(() => undefined);

const PlatformAnnouncementService = {
    getAll,
    create,
    update,
    remove,
};

export default PlatformAnnouncementService;
