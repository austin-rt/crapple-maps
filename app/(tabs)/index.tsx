import { MobileMap } from '@/components/finder/MobileMap';

// Native map screen — the shared mobile map experience, identical to mobile web
// (only desktop web gets a different layout, in index.web.tsx).
export default function MapScreen() {
  return <MobileMap />;
}
