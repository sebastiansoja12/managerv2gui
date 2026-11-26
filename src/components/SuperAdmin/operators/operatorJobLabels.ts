import pl from "../../../i18n/translate";
import {OperatorJobRun} from "./model/OperatorOperations";

type OperatorJobTexts = {label: string; description: string};

const jobTexts = () => pl.superAdmin.adminActions.jobs as Record<string, OperatorJobTexts>;

export const operatorJobLabel = (jobType: string) => jobTexts()[jobType]?.label || jobType;

export const operatorJobDescription = (jobType: string) => jobTexts()[jobType]?.description || "";

export type OperatorActionResult = {
    severity: "success" | "info" | "error";
    message: string;
};

export const describeOperatorJobRun = (run: OperatorJobRun): OperatorActionResult => {
    const texts = pl.superAdmin.adminActions.results;
    const affected = String(run.affected);
    if (run.jobType === "COURIER_ASSIGNMENT_ORCHESTRATION") {
        return run.affected > 0
            ? {severity: "success", message: texts.orchestrated.replace("{affected}", affected).replace("{total}", String(run.total ?? 0))}
            : {severity: "info", message: texts.noDepartments};
    }
    if (run.jobType === "COURIER_ASSIGNMENT_RECOVERY") {
        return run.affected > 0
            ? {severity: "success", message: texts.recovered.replace("{affected}", affected)}
            : {severity: "info", message: texts.nothingToRecover};
    }
    return {
        severity: "success",
        message: texts.finished.replace("{job}", operatorJobLabel(run.jobType)).replace("{affected}", affected),
    };
};
