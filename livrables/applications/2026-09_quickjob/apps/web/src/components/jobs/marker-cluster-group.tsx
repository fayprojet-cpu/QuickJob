'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Job } from '@/types/api';

const JOB_ICON = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:50% 50% 50% 0;background:#2F6B3F;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:rotate(-45deg);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

interface GeoJob extends Job {
  latitude: string;
  longitude: string;
}

/**
 * Regroupe les marqueurs proches (imperatif, via `useMap()`) — même pattern
 * que le composant `Recenter` déjà utilisé pour la carte. react-leaflet n'a
 * pas de wrapper officiel pour leaflet.markercluster compatible React 18,
 * donc on pilote le plugin Leaflet directement plutôt que d'ajouter une
 * dépendance qui imposerait React 19.
 */
export function MarkerClusterGroup({
  jobs,
  onSelectJob,
}: {
  jobs: GeoJob[];
  onSelectJob: (job: GeoJob) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const cluster = L.markerClusterGroup({ maxClusterRadius: 50 });
    clusterRef.current = cluster;
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();
    const markers = jobs.map((job) => {
      const marker = L.marker([Number(job.latitude), Number(job.longitude)], { icon: JOB_ICON });
      marker.on('click', () => onSelectJob(job));
      return marker;
    });
    cluster.addLayers(markers);
  }, [jobs, onSelectJob]);

  return null;
}
