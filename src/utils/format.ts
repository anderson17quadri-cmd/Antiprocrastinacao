/** 5025 -> "01:23:45" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** 90 -> "1h 30m" · 45 -> "45 min" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** Segundos -> "24h 30m" */
export function formatHours(seconds: number): string {
  return formatMinutes(Math.round(seconds / 60));
}

/** 1250 -> "1.250" */
export function formatPoints(value: number): string {
  return value.toLocaleString('pt-BR');
}

/** "14:00" + 60 min -> "14:00 – 15:00" */
export function timeRange(time: string | undefined, minutes: number): string {
  if (!time) return formatMinutes(minutes);
  const [h, m] = time.split(':').map(Number);
  const end = new Date(2000, 0, 1, h, m + minutes);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${time} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}
