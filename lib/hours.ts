// Evaluate an OSM `opening_hours` string (the subset that actually appears in
// our data) to open/closed right now. Returns null when the spec is missing or
// unparseable so callers can omit the segment rather than guess.
//
// Handles: "24/7", "Mo-Su 06:00-22:00", bare "06:00-24:00", overnight ranges
// ("06:00-02:00"), comma day/time lists, month-range prefixes ("May-Oct …;
// Nov-Apr off"), "off"/"closed" rules, PH/SH (ignored), and sunrise/sunset/
// dawn/dusk (approximated to 06:00/20:00).

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const timeToMin = (t: string): number | null => {
  const solar = /sunrise|dawn/i.test(t) ? '06:00' : /sunset|dusk/i.test(t) ? '20:00' : t;
  const m = solar.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

const expandDays = (spec: string): Set<number> | null => {
  const out = new Set<number>();
  for (const part of spec.split(',')) {
    if (/^(PH|SH)$/i.test(part)) continue; // public/school holidays — ignore
    const range = part.match(/^([A-Z][a-z])-([A-Z][a-z])$/);
    if (range) {
      const a = DAYS.indexOf(range[1]);
      const b = DAYS.indexOf(range[2]);
      if (a < 0 || b < 0) return null;
      for (let d = a; ; d = (d + 1) % 7) {
        out.add(d);
        if (d === b) break;
      }
    } else {
      const d = DAYS.indexOf(part);
      if (d < 0) return null;
      out.add(d);
    }
  }
  return out;
};

const monthMatches = (spec: string, month: number): boolean | null => {
  const range = spec.match(/^([A-Z][a-z]{2})-([A-Z][a-z]{2})$/);
  const a = MONTHS.indexOf(range ? range[1] : spec);
  const b = MONTHS.indexOf(range ? range[2] : spec);
  if (a < 0 || b < 0) return null;
  if (a <= b) return month >= a && month <= b;
  return month >= a || month <= b; // wraps year end (Nov-Apr)
};

export function isOpenNow(spec: string | null | undefined, now = new Date()): boolean | null {
  if (!spec) return null;
  const s = spec.trim();
  if (s === '24/7') return true;

  const day = now.getDay();
  const month = now.getMonth();
  const minutes = now.getHours() * 60 + now.getMinutes();
  let verdict: boolean | null = null;

  for (let rule of s.split(';').map((r) => r.trim()).filter(Boolean)) {
    // optional month-range prefix, e.g. "May-Oct 09:00-22:00" / "Nov-Apr off"
    const monthPrefix = rule.match(/^((?:[A-Z][a-z]{2})(?:-[A-Z][a-z]{2})?)\s+(.*)$/);
    if (monthPrefix && MONTHS.includes(monthPrefix[1].slice(0, 3))) {
      const applies = monthMatches(monthPrefix[1], month);
      if (applies === null) return null;
      if (!applies) continue;
      rule = monthPrefix[2];
    }

    // optional day list, e.g. "Mo-Sa 10:00-22:00" / "Su,PH 14:00-20:00"
    let days: Set<number> | null = null;
    const dayPrefix = rule.match(/^((?:[A-Z][a-z]|PH|SH)(?:[,-](?:[A-Z][a-z]|PH|SH))*)\s+(.*)$/);
    if (dayPrefix) {
      days = expandDays(dayPrefix[1]);
      if (!days) return null;
      rule = dayPrefix[2];
    }
    if (days && !days.has(day)) continue;

    if (/^(off|closed)$/i.test(rule)) {
      verdict = false;
      continue;
    }

    // comma list of time ranges; "00:00-00:00" and "00:00-24:00" mean all day
    let open = false;
    let parsedAny = false;
    for (const t of rule.split(',').map((x) => x.trim())) {
      const m = t.match(/^(\S+)-(\S+)$/);
      if (!m) continue;
      const a = timeToMin(m[1]);
      const b = m[2] === '24:00' ? 24 * 60 : timeToMin(m[2]);
      if (a == null || b == null) continue;
      parsedAny = true;
      if (a === b) open = true; // 00:00-00:00 → 24h
      else if (a < b) open = open || (minutes >= a && minutes < b);
      else open = open || minutes >= a || minutes < b; // overnight wrap
    }
    if (!parsedAny) return null;
    verdict = open;
  }
  return verdict;
}
