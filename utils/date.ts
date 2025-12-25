export const getAdjustedDate = (): string => {
    const now = new Date();
    // If current hour is before 4 AM (00:00 - 03:59), we treat it as the previous day
    if (now.getHours() < 4) {
        now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
};

export const isAdjustedToday = (dateStr: string): boolean => {
    return dateStr === getAdjustedDate();
};

export const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
