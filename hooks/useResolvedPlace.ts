import { useEffect, useState } from 'react';

import { reverseGeocode, type Place } from '@/lib/geocode';

// Reverse-geocode a coordinate to a Place (restroom sheet + log sheet).
export function useResolvedPlace(lat: number, lng: number, priority = false): Place | null {
  const [place, setPlace] = useState<Place | null>(null);
  useEffect(() => {
    let on = true;
    setPlace(null);
    reverseGeocode(lat, lng, priority).then((p) => on && setPlace(p));
    return () => {
      on = false;
    };
  }, [lat, lng, priority]);
  return place;
}
