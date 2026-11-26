export type LinearScale = {
    minimum: number;
    maximum: number;
    ticks: number[];
};

const niceStep = (range: number, tickCount: number) => {
    const roughStep = range / Math.max(tickCount, 1);
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
    return factor * magnitude;
};

export const linearScale = (values: number[], tickCount = 4): LinearScale => {
    const dataMinimum = Math.min(0, ...values);
    const dataMaximum = Math.max(0, ...values);
    if (dataMinimum === dataMaximum) {
        return {minimum: 0, maximum: 1, ticks: [0, 1]};
    }
    const step = niceStep(dataMaximum - dataMinimum, tickCount);
    const minimum = Math.floor(dataMinimum / step) * step;
    const maximum = Math.ceil(dataMaximum / step) * step;
    const ticks: number[] = [];
    for (let tick = minimum; tick <= maximum + step / 2; tick += step) {
        ticks.push(Math.round(tick * 1e6) / 1e6);
    }
    return {minimum, maximum, ticks};
};

export const project = (value: number, scale: LinearScale, top: number, height: number) =>
    top + height - ((value - scale.minimum) / (scale.maximum - scale.minimum)) * height;
