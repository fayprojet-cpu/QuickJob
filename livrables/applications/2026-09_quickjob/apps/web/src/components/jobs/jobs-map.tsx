'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Locate } from 'lucide-react';
import { fetchJobsInBounds } from '@/features/jobs/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { haversineDistanceKm } from '@/lib/geo';
import { fetchRoute, type RouteResult } from '@/lib/routing';
import { MarkerClusterGroup } from './marker-cluster-group';
import { MissionBottomSheet } from './mission-bottom-sheet';
import type { Job, MapBounds } from '@/types/api';

const USER_ICON = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#1A1A1A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const WORLD_CENTER: [number, number] = [10, 5];
const BOUNDS_DEBOUNCE_MS = 500;

interface GeoJob extends Job {
  latitude: string;
  longitude: string;
}

function boundsToKey(bounds: MapBounds): string {
  return [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng].map((n) => n.toFixed(2)).join(',');
}

/**
 * Pilote la carte de façon imperative (via `useMap()`) : signale la zone
 * visible (avec un debounce) pour le chargement dynamique des missions,
 * recentre sur l'utilisateur et cadre l'itinéraire sur demande. Regroupe ces
 * effets dans un seul composant pour n'avoir qu'un point d'accès à
 * l'instance Leaflet, plutôt que d'en éparpiller plusieurs.
 */
function MapController({
  onBoundsChange,
  recenterTarget,
  onRecentered,
  fitBoundsTarget,
  onFitted,
}: {
  onBoundsChange: (bounds: MapBounds) => void;
  recenterTarget: [number, number] | null;
  onRecentered: () => void;
  fitBoundsTarget: L.LatLngBoundsExpression | null;
  onFitted: () => void;
}) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportBounds = useCallback(() => {
    const b = map.getBounds();
    // Clamp : un zoom très arrière ou un monde parcouru plusieurs fois peut
    // renvoyer des bornes hors [-90,90]/[-180,180], que l'API rejetterait.
    onBoundsChange({
      minLat: Math.max(-90, b.getSouth()),
      maxLat: Math.min(90, b.getNorth()),
      minLng: Math.max(-180, b.getWest()),
      maxLng: Math.min(180, b.getEast()),
    });
  }, [map, onBoundsChange]);

  useEffect(() => {
    reportBounds();
  }, [reportBounds]);

  useMapEvents({
    moveend: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reportBounds, BOUNDS_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    if (recenterTarget) {
      map.setView(recenterTarget, 13, { animate: true });
      onRecentered();
    }
  }, [recenterTarget, map, onRecentered]);

  useEffect(() => {
    if (fitBoundsTarget) {
      map.fitBounds(fitBoundsTarget, { padding: [48, 48] });
      onFitted();
    }
  }, [fitBoundsTarget, map, onFitted]);

  return null;
}

export function JobsMap() {
  const t = useTranslations('jobs');
  const { position: userPos, status: geoStatus, request: requestGeo } = useGeolocation();

  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedJob, setSelectedJob] = useState<GeoJob | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [recenterTarget, setRecenterTarget] = useState<[number, number] | null>(null);
  const [fitBoundsTarget, setFitBoundsTarget] = useState<L.LatLngBoundsExpression | null>(null);
  const [pendingRecenter, setPendingRecenter] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(false);

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'map', bounds ? boundsToKey(bounds) : 'initial'],
    queryFn: () => (bounds ? fetchJobsInBounds(bounds) : Promise.resolve([])),
    enabled: bounds !== null,
    placeholderData: (previous) => previous,
  });

  const geoJobs = useMemo(
    () =>
      (jobsQuery.data ?? []).filter((job): job is GeoJob => {
        if (job.latitude == null || job.longitude == null) return false;
        return Number.isFinite(Number(job.latitude)) && Number.isFinite(Number(job.longitude));
      }),
    [jobsQuery.data],
  );

  const loadRoute = useCallback(
    async (origin: { latitude: number; longitude: number }, target: GeoJob) => {
      setRouteStatus('loading');
      const result = await fetchRoute(origin, {
        latitude: Number(target.latitude),
        longitude: Number(target.longitude),
      });
      if (result) {
        setRoute(result);
        setRouteStatus('idle');
        setFitBoundsTarget(L.latLngBounds(result.coordinates));
      } else {
        setRouteStatus('error');
      }
    },
    [],
  );

  useEffect(() => {
    if (pendingRecenter && userPos) {
      setPendingRecenter(false);
      setRecenterTarget([userPos.latitude, userPos.longitude]);
    }
    if (pendingRoute && userPos && selectedJob) {
      setPendingRoute(false);
      void loadRoute(userPos, selectedJob);
    }
    if ((pendingRecenter || pendingRoute) && geoStatus === 'error') {
      if (pendingRoute) setRouteStatus('error');
      setPendingRecenter(false);
      setPendingRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, geoStatus]);

  function handleRecenterClick() {
    if (userPos) {
      setRecenterTarget([userPos.latitude, userPos.longitude]);
    } else {
      setPendingRecenter(true);
      requestGeo();
    }
  }

  const handleSelectJob = useCallback((job: GeoJob) => {
    setSelectedJob(job);
    setRoute(null);
    setRouteStatus('idle');
  }, []);

  function handleRequestRoute() {
    if (!selectedJob) return;
    if (userPos) {
      void loadRoute(userPos, selectedJob);
    } else {
      setPendingRoute(true);
      requestGeo();
    }
  }

  const selectedDistanceKm =
    userPos && selectedJob
      ? haversineDistanceKm(
          userPos.latitude,
          userPos.longitude,
          Number(selectedJob.latitude),
          Number(selectedJob.longitude),
        )
      : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-neutral-200">
      <MapContainer
        center={WORLD_CENTER}
        zoom={2}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          onBoundsChange={setBounds}
          recenterTarget={recenterTarget}
          onRecentered={() => setRecenterTarget(null)}
          fitBoundsTarget={fitBoundsTarget}
          onFitted={() => setFitBoundsTarget(null)}
        />
        <MarkerClusterGroup jobs={geoJobs} onSelectJob={handleSelectJob} />
        {userPos ? (
          <Marker position={[userPos.latitude, userPos.longitude]} icon={USER_ICON} />
        ) : null}
        {route ? <Polyline positions={route.coordinates} color="#c2410c" weight={4} /> : null}
      </MapContainer>

      <button
        type="button"
        onClick={handleRecenterClick}
        aria-label={t('map.nearMe')}
        className="absolute bottom-4 right-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Locate className={`h-5 w-5 ${geoStatus === 'loading' ? 'animate-pulse' : ''}`} aria-hidden />
      </button>

      {jobsQuery.isFetching ? (
        <div className="absolute left-4 top-4 z-[1000] rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-500 shadow">
          {t('map.loading')}
        </div>
      ) : null}

      {bounds && !jobsQuery.isFetching && geoJobs.length === 0 ? (
        <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-500 shadow">
          {t('map.noCoordinates')}
        </div>
      ) : null}

      {geoStatus === 'error' ? (
        <div className="absolute bottom-4 left-4 right-20 z-[1000] rounded-lg bg-white px-3 py-2 text-xs text-neutral-500 shadow">
          {t('map.locationDenied')}
        </div>
      ) : null}

      {selectedJob ? (
        <MissionBottomSheet
          key={selectedJob.id}
          job={selectedJob}
          distanceKm={selectedDistanceKm}
          onClose={() => setSelectedJob(null)}
          onRequestRoute={handleRequestRoute}
          routeStatus={routeStatus}
          routeSummary={route ? { distanceKm: route.distanceKm, durationMin: route.durationMin } : null}
        />
      ) : null}
    </div>
  );
}

export default JobsMap;
