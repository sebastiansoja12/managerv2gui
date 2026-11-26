import React from "react";

const DEFAULT_CHART_WIDTH = 760;

// Draws at the container's real width so labels keep their size instead of scaling with the panel.
export const useMeasuredWidth = (elementRef: React.RefObject<HTMLElement>, defaultWidth = DEFAULT_CHART_WIDTH) => {
    const [measuredWidth, setMeasuredWidth] = React.useState(defaultWidth);

    React.useEffect(() => {
        const element = elementRef.current;
        if (!element || typeof ResizeObserver === "undefined") {
            return undefined;
        }

        const observer = new ResizeObserver(([entry]) => {
            const contentWidth = Math.round(entry.contentRect.width);
            if (contentWidth > 0) {
                setMeasuredWidth(contentWidth);
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [elementRef]);

    return measuredWidth;
};
