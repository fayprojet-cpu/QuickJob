'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { haversineDistanceKm } from '@/lib/geo';
import type { Job } from '@/types/api';

const JOB_ICON = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:50% 50% 50% 0;background:#c2410c;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:rotate(-45deg);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -18],
});

const USER_ICON = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const WORLD_CENTER: [number, number] = [10, 5];

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

interface GeoJob extends Job {
  latitude: string;
  longitude: string;
}

export function JobsMap({ jobs }: { jobs: Job[] }) {
  const t = useTranslations('jobs');
  const locale = useLocale();

  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const geoJobs = useMemo(
    () =>
      jobs.filter(
        (job): job is GeoJob => job.latitude != null && job.longitude != null,
      ),
    [jobs],
  );

  const nearest = useMemo(() => {
    if (!userPosition) return [];
    return geoJobs
      .map((job) => ({
        job,
        distanceKm: haversineDistanceKm(
          userPosition[0],
          userPosition[1],
          Number(job.latitude),
          Number(job.longitude),
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [geoJobs, userPosition]);

  function handleNearMe() {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setGeoStatus('idle');
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNearMe}
          isLoading={geoStatus === 'loading'}
        >
          {t('map.nearMe')}
        </Button>
        {geoStatus === 'error' ? (
          <p className="text-xs text-neutral-500">{t('map.locationDenied')}</p>
        ) : null}
      </div>

      {geoJobs.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
          {t('map.noCoordinates')}
        </p>
      ) : (
        <div className="h-[520px] w-full overflow-hidden rounded-lg border border-neutral-200">
          <MapContainer
            center={userPosition ?? WORLD_CENTER}
            zoom={userPosition ? 11 : 2}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPosition ? <Recenter center={userPosition} zoom={11} /> : null}
            {userPosition ? (
              <Marker position={userPosition} icon={USER_ICON}>
                <Popup>{t('map.youAreHere')}</Popup>
              </Marker>
            ) : null}
            {geoJobs.map((job) => (
              <Marker
                key={job.id}
                position={[Number(job.latitude), Number(job.longitude)]}
                icon={JOB_ICON}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1">
                    <p className="font-semibold text-neutral-900">{job.title}</p>
                    <p className="text-sm text-primary-600">
                      {job.salaryAmount && job.salaryCurrency
                        ? formatMoney(job.salaryAmount, job.salaryCurrency, locale)
                        : t('negotiable')}
                    </p>
                    {job.city ? <p className="text-xs text-neutral-500">{job.city}</p> : null}
                    <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-primary-600 underline">
                      {t('map.viewJob')}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {userPosition && nearest.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-neutral-900">{t('map.nearestTitle')}</h3>
          <ul className="mt-2 space-y-2">
            {nearest.map(({ job, distanceKm }) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:border-primary-200"
                >
                  <span className="font-medium text-neutral-900">{job.title}</span>
                  <span className="shrink-0 text-neutral-500">
                    {t('map.distanceKm', { distance: distanceKm.toFixed(1) })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default JobsMap;
