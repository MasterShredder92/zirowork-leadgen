export const pct = (part, whole) => whole <= 0 ? 0 : Math.round((part / whole) * 10000) / 100;
