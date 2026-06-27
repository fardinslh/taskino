export function elapsedDurationMinutes(startedAt?: string | null) {
  if (!startedAt) return undefined;
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return undefined;
  return Math.max(1, Math.ceil((Date.now() - start) / 60000));
}

export function formatDurationMinutes(minutes?: number | null) {
  if (minutes == null) return "";
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (hours && remainingMinutes) {
    return `${hours} ساعت و ${remainingMinutes} دقیقه`;
  }
  if (hours) return `${hours} ساعت`;
  return `${remainingMinutes} دقیقه`;
}
