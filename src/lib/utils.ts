export const fmt = (n: number | null | undefined) => 
  "RM " + (Math.round((n || 0) * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const monthKeyOf = (dateStr: string) => dateStr.slice(0, 7);
