// Shared 13+ logic. Two enforcement points, because the two sign-up paths differ:
//
//  • Email — AuthForm checks before calling signUp, so an under-13 account is
//    never created and nothing is persisted. This is the good path.
//  • Google / Apple — the provider creates the account the moment the user
//    authenticates and Supabase has no "sign in but don't create" flag for
//    OAuth, so the row exists before any of our code runs. AgeGate catches it
//    immediately afterward and deletes it.
export const MIN_AGE = 13;

export function isValidDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  // Rejects 31 Feb and friends — JS silently rolls those into the next month.
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// Whole years elapsed. Compared calendar-wise rather than by dividing a
// millisecond span, which drifts across leap years near a birthday.
export function ageOn(year: number, month: number, day: number, now = new Date()) {
  let age = now.getFullYear() - year;
  const before =
    now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
  return before ? age - 1 : age;
}

export type DobCheck =
  | { ok: true; age: number }
  | { ok: false; reason: 'invalid' | 'under' | 'implausible'; age?: number };

export function checkDob(mm: string, dd: string, yyyy: string): DobCheck {
  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);
  const y = parseInt(yyyy, 10);
  if (!isValidDate(y, m, d)) return { ok: false, reason: 'invalid' };
  const age = ageOn(y, m, d);
  if (age > 120) return { ok: false, reason: 'implausible' };
  if (age < MIN_AGE) return { ok: false, reason: 'under', age };
  return { ok: true, age };
}

export function formatDob(mm: string, dd: string, yyyy: string) {
  const d = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
