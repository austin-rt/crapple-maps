import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

// Original, layered people-avatar factory (rich flat-vector, seeded).
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length)];
function hexRgb(h: string) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
function shade(h: string, f: number) {
  const [r, g, b] = hexRgb(h);
  return rgbHex(r * f, g * f, b * f);
}
function tint(h: string, f: number) {
  const [r, g, b] = hexRgb(h);
  return rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}

const SKIN = ['#F8D2BC', '#F0C0A0', '#E0A878', '#C68A56', '#9E6B43', '#6E4A2E'];
const HAIR = ['#221A16', '#3B2A1E', '#5C3A22', '#8A5A2B', '#C08442', '#E3BE79', '#141821', '#6D28D9'];
const SHIRT = ['#7C3AED', '#4F46E5', '#0EA5E9', '#0D9488', '#F59E0B', '#EF4444', '#DB2777', '#334155'];
const BG = ['#EADCF9', '#D8E8FB', '#D6F2E2', '#FCEFC7', '#FBDCEC', '#E4E7EB', '#EFE7FB', '#CFF3EC'];

// styles: 0 short · 1 afro · 2 long · 3 bun · 4 buzz · 5 bald · 6 bob · 7 ponytail · 8 wavy
const FEMALE = [2, 6, 3, 7, 8];
const MALE = [0, 4, 5, 0, 1];

const CAP_FULL = 'M31 45 C30 27 41 23 50 23 C59 23 70 27 69 45 C65 35 58 32 50 32 C42 32 35 35 31 45 Z';
const CAP_BUZZ = 'M33 42 C33 31 41 28 50 28 C59 28 67 31 67 42 C64 36 58 34 50 34 C42 34 36 36 33 42 Z';

// Behind-the-head hair masses (drawn before the head so it frames the face).
const BACK: Record<number, string> = {
  2: 'M23 40 C14 60 17 86 24 100 L41 100 C34 82 33 58 45 47 C57 58 66 82 59 100 L76 100 C83 86 86 60 77 40 C77 24 64 19 50 19 C36 19 23 24 23 40 Z',
  6: 'M26 42 C21 55 23 69 31 76 C33 66 35 57 45 49 C55 57 67 66 69 76 C77 69 79 55 74 42 C74 27 63 21 50 21 C37 21 26 27 26 42 Z',
  7: 'M64 29 C86 33 93 60 82 88 C80 68 73 51 58 44 C62 38 64 32 64 29 Z',
  8: 'M22 41 C15 58 19 80 14 100 L39 100 C35 83 34 58 45 47 C57 58 64 80 61 100 L87 100 C83 80 86 58 78 41 C78 25 64 20 50 20 C36 20 22 25 22 41 Z',
};

export function Avatar({
  seed,
  size = 84,
  variant,
}: {
  seed: string;
  size?: number;
  variant?: 'm' | 'f';
}) {
  const r = mulberry32(hashStr(seed || 'user'));
  const skin = pick(SKIN, r());
  const hair = pick(HAIR, r());
  const shirt = pick(SHIRT, r());
  const bg = pick(BG, r());
  const style = variant === 'f' ? pick(FEMALE, r()) : variant === 'm' ? pick(MALE, r()) : Math.floor(r() * 9);

  const skinSh = shade(skin, 0.9);
  const hairSh = shade(hair, 0.85);
  const hairHi = tint(hair, 0.28);
  const shirtSh = shade(shirt, 0.82);
  const shirtHi = tint(shirt, 0.18);

  const hasCap = style !== 5; // bald has no forehead hair
  const cap = style === 4 ? CAP_BUZZ : CAP_FULL;
  const back = BACK[style];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={50} fill={bg} />
      <Ellipse cx={36} cy={30} rx={42} ry={34} fill="#ffffff" opacity={0.1} />

      {/* back hair (behind head) */}
      {back ? <Path d={back} fill={hairSh} /> : null}
      {style === 1 ? <Circle cx={50} cy={39} r={22} fill={hair} /> : null}

      {/* shirt */}
      <Path d="M13 100 C13 71 31 63 50 63 C69 63 87 71 87 100 Z" fill={shirt} />
      <Path d="M13 100 C13 78 26 69 40 65 C34 76 33 88 35 100 Z" fill={shirtHi} opacity={0.35} />
      <Path d="M44 64 C46 71 54 71 56 64 C54 68 46 68 44 64 Z" fill={shirtSh} />

      {/* neck */}
      <Rect x={44} y={51} width={12} height={17} rx={5} fill={skin} />
      <Ellipse cx={50} cy={55} rx={13} ry={6} fill={skinSh} opacity={0.55} />

      {/* ears */}
      <Circle cx={32} cy={44} r={4.6} fill={skin} />
      <Circle cx={68} cy={44} r={4.6} fill={skin} />
      <Circle cx={32} cy={44} r={2} fill={skinSh} opacity={0.6} />
      <Circle cx={68} cy={44} r={2} fill={skinSh} opacity={0.6} />

      {/* head */}
      <Circle cx={50} cy={43} r={17.5} fill={skin} />
      <Path d="M50 25.5 A17.5 17.5 0 0 1 50 60.5 A13 17 0 0 0 50 25.5 Z" fill={skinSh} opacity={0.35} />

      {/* blush */}
      <Ellipse cx={41} cy={49} rx={3.2} ry={2.2} fill="#F59AA0" opacity={0.4} />
      <Ellipse cx={59} cy={49} rx={3.2} ry={2.2} fill="#F59AA0" opacity={0.4} />

      {/* eyes — small, simple, calm */}
      <Ellipse cx={43} cy={43.6} rx={1.7} ry={2.3} fill="#2b2320" />
      <Ellipse cx={57} cy={43.6} rx={1.7} ry={2.3} fill="#2b2320" />
      <Circle cx={43.6} cy={42.9} r={0.5} fill="#ffffff" opacity={0.85} />
      <Circle cx={57.6} cy={42.9} r={0.5} fill="#ffffff" opacity={0.85} />

      {/* brows, nose, mouth */}
      <Path d="M40 39 Q43 37.7 46 39" stroke={hairSh} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Path d="M54 39 Q57 37.7 60 39" stroke={hairSh} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Path d="M50 45 L50 49" stroke={skinSh} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M46 52.5 Q50 55.5 54 52.5" stroke={shade(skin, 0.55)} strokeWidth={1.6} fill="none" strokeLinecap="round" />

      {/* forehead hair + accessories (on top) */}
      {hasCap ? (
        <>
          <Path d={cap} fill={hair} />
          <Path d="M34 40 C37 30 45 27 52 28 C46 29 40 33 37 41 Z" fill={hairHi} opacity={0.55} />
        </>
      ) : null}
      {style === 3 ? <Circle cx={50} cy={19} r={8} fill={hair} /> : null}
      {style === 7 ? <Circle cx={62} cy={31} r={3.6} fill={hairSh} /> : null}
    </Svg>
  );
}
