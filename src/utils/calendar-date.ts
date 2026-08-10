// Petits utilitaires de date pour l'écran Calendrier. Pas de librairie de date
// dans le projet (date-fns/dayjs) : Intl suffit pour du formatage FR simple.

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatMonthLabel(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date),
  );
}

export function formatDayHeading(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
  );
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

/** Regroupe une liste de rendez-vous (triés par date croissante) par jour civil. */
export function groupByDay<T extends { scheduledAt: string }>(items: T[]): { day: Date; items: T[] }[] {
  const groups: { day: Date; items: T[] }[] = [];
  for (const item of items) {
    const date = new Date(item.scheduledAt);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, date)) {
      last.items.push(item);
    } else {
      groups.push({ day: date, items: [item] });
    }
  }
  return groups;
}
