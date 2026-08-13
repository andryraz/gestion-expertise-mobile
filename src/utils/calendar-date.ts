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

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Lundi de la semaine contenant `date` (convention française : semaine démarrant lundi). */
export function startOfWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7; // getDay(): 0 = dimanche, on veut 0 = lundi
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset);
}

/**
 * Toutes les cellules d'une grille mensuelle (lundi → dimanche) : les derniers
 * jours du mois précédent pour compléter la première semaine, tous les jours
 * du mois, puis les premiers jours du mois suivant pour finir la dernière
 * semaine. Le nombre de cellules est toujours un multiple de 7.
 */
export function getMonthGridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = startOfWeek(first);
  const end = startOfWeek(endOfMonth(month));
  end.setDate(end.getDate() + 6);

  const days: Date[] = [];
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

/** Clé locale (année-mois-jour) servant à indexer les rendez-vous par jour civil. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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


