import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";

export function formatRelative(value: string | number | Date): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 45_000) return "just now";
  return `${formatDistanceToNowStrict(date)} ago`;
}

export function formatClock(value: string | number | Date): string {
  return format(new Date(value), "HH:mm");
}

export function formatDayLabel(value: string | number | Date): string {
  const date = new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE d MMMM");
}

export function formatDate(value: string | number | Date): string {
  return format(new Date(value), "d MMM yyyy");
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function initialsOf(first?: string | null, last?: string | null): string {
  const value = `${first?.trim().charAt(0) ?? ""}${last?.trim().charAt(0) ?? ""}`;
  return value.toUpperCase() || "AP";
}

export function fullName(first?: string | null, last?: string | null): string {
  return `${first ?? ""} ${last ?? ""}`.trim() || "Team member";
}
