'use client';

import { useCallback, useState } from 'react';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

/**
 * Enrobe `navigator.geolocation.getCurrentPosition` — factorise la logique
 * dupliquée entre le formulaire de publication ("Utiliser ma position") et
 * la carte des missions ("Près de moi" / itinéraire).
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude });
        setStatus('success');
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { position, status, request };
}
