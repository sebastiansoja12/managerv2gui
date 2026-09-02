export type AreaPoint = {
    latitude: number;
    longitude: number;
};

const orientation = (first: AreaPoint, second: AreaPoint, third: AreaPoint) => (
    (second.longitude - first.longitude) * (third.latitude - first.latitude)
    - (second.latitude - first.latitude) * (third.longitude - first.longitude)
);

const intersects = (first: AreaPoint, second: AreaPoint, third: AreaPoint, fourth: AreaPoint) => {
    const firstSide = orientation(first, second, third);
    const secondSide = orientation(first, second, fourth);
    const thirdSide = orientation(third, fourth, first);
    const fourthSide = orientation(third, fourth, second);
    const onSegment = (start: AreaPoint, point: AreaPoint, end: AreaPoint) => (
        point.latitude >= Math.min(start.latitude, end.latitude)
        && point.latitude <= Math.max(start.latitude, end.latitude)
        && point.longitude >= Math.min(start.longitude, end.longitude)
        && point.longitude <= Math.max(start.longitude, end.longitude)
    );
    return (firstSide * secondSide < 0 && thirdSide * fourthSide < 0)
        || (firstSide === 0 && onSegment(first, third, second))
        || (secondSide === 0 && onSegment(first, fourth, second))
        || (thirdSide === 0 && onSegment(third, first, fourth))
        || (fourthSide === 0 && onSegment(third, second, fourth));
};

export const isValidArea = (points: AreaPoint[]) => {
    if (points.length < 3 || points.some(({latitude, longitude}) => (
        !Number.isFinite(latitude) || !Number.isFinite(longitude)
        || Math.abs(latitude) > 90 || Math.abs(longitude) > 180
    ))) {
        return false;
    }
    if (points.some((point, index) => points.some((other, otherIndex) => (
        index !== otherIndex && point.latitude === other.latitude && point.longitude === other.longitude
    )))) {
        return false;
    }

    const twiceArea = points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return sum + point.longitude * next.latitude - next.longitude * point.latitude;
    }, 0);
    if (Math.abs(twiceArea) < 1e-12) {
        return false;
    }

    for (let first = 0; first < points.length; first += 1) {
        for (let second = first + 1; second < points.length; second += 1) {
            const adjacent = second === first + 1 || (first === 0 && second === points.length - 1);
            if (!adjacent && intersects(
                points[first], points[(first + 1) % points.length],
                points[second], points[(second + 1) % points.length],
            )) {
                return false;
            }
        }
    }
    return true;
};

export const insertionIndex = (points: AreaPoint[], point: AreaPoint) => {
    let closestEdge = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    const latitudeScale = Math.cos(point.latitude * Math.PI / 180);

    points.forEach((start, index) => {
        const end = points[(index + 1) % points.length];
        const startX = (start.longitude - point.longitude) * latitudeScale;
        const startY = start.latitude - point.latitude;
        const endX = (end.longitude - point.longitude) * latitudeScale;
        const endY = end.latitude - point.latitude;
        const edgeX = endX - startX;
        const edgeY = endY - startY;
        const lengthSquared = edgeX * edgeX + edgeY * edgeY;
        const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
            -(startX * edgeX + startY * edgeY) / lengthSquared,
        ));
        const dx = startX + fraction * edgeX;
        const dy = startY + fraction * edgeY;
        const distance = dx * dx + dy * dy;
        if (distance < closestDistance) {
            closestDistance = distance;
            closestEdge = index;
        }
    });

    return closestEdge + 1;
};
