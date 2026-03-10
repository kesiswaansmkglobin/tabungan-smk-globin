import React, { Suspense, memo, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { SkeletonDashboard, SkeletonTable, SkeletonForm } from './ui/skeleton-loaders';

// Skeleton mapping per component type
const skeletonMap: Record<string, React.ReactNode> = {
  dashboard: <SkeletonDashboard />,
  table: <SkeletonTable rows={6} cols={5} />,
  form: <SkeletonForm fields={5} />,
};

// Default loading with skeleton
const LoadingFallback = memo(({ type = "table" }: { type?: string }) => (
  <div className="animate-in">
    {skeletonMap[type] || skeletonMap.table}
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

// Component cache to prevent re-imports
const componentCache = new Map<string, Promise<any>>();

// Lazy loaded components with cached imports
const createLazyComponent = (importFn: () => Promise<any>, name: string) => {
  return React.lazy(() => {
    if (!componentCache.has(name)) {
      const promise = importFn().catch((err) => {
        // Remove from cache so retry is possible
        componentCache.delete(name);
        throw err;
      });
      componentCache.set(name, promise);
    }
    return componentCache.get(name)!;
  });
};

export const LazyDataSekolah = createLazyComponent(() => import('./DataSekolah'), 'DataSekolah');
export const LazyDataKelas = createLazyComponent(() => import('./DataKelas'), 'DataKelas');
export const LazyDataSiswa = createLazyComponent(() => import('./DataSiswa'), 'DataSiswa');
export const LazyTransaksi = createLazyComponent(() => import('./Transaksi'), 'Transaksi');
export const LazyLaporan = createLazyComponent(() => import('./Laporan'), 'Laporan');
export const LazyRiwayatHarian = createLazyComponent(() => import('./RiwayatHarian'), 'RiwayatHarian');
export const LazyPengaturan = createLazyComponent(() => import('./Pengaturan'), 'Pengaturan');
export const LazyPengguna = createLazyComponent(() => import('./Pengguna'), 'Pengguna');
export const LazyWaliKelasView = createLazyComponent(() => import('./WaliKelasView'), 'WaliKelasView');
export const LazyWaliKelasDataSiswa = createLazyComponent(() => import('./WaliKelasDataSiswa'), 'WaliKelasDataSiswa');
export const LazyAuditLogs = createLazyComponent(() => import('./AuditLogs'), 'AuditLogs');
export const LazyStaffDashboard = createLazyComponent(() => import('./StaffDashboard'), 'StaffDashboard');
export const LazyStaffClassSummary = createLazyComponent(() => import('./StaffClassSummary'), 'StaffClassSummary');

// Prefetch function with caching
export const prefetchComponent = (component: string) => {
  const imports: Record<string, () => Promise<any>> = {
    'data-sekolah': () => import('./DataSekolah'),
    'data-kelas': () => import('./DataKelas'),
    'data-siswa': () => import('./DataSiswa'),
    'transaksi': () => import('./Transaksi'),
    'laporan': () => import('./Laporan'),
    'riwayat-harian': () => import('./RiwayatHarian'),
    'pengaturan': () => import('./Pengaturan'),
    'pengguna': () => import('./Pengguna'),
    'wali-kelas-view': () => import('./WaliKelasView'),
    'wali-kelas-data-siswa': () => import('./WaliKelasDataSiswa'),
    'audit-logs': () => import('./AuditLogs'),
    'staff-dashboard': () => import('./StaffDashboard'),
    'staff-class-summary': () => import('./StaffClassSummary'),
  };

  if (imports[component] && !componentCache.has(component)) {
    const promise = imports[component]().catch((err) => {
      componentCache.delete(component);
      throw err;
    });
    componentCache.set(component, promise);
  }
};

// Prefetch multiple components at once
export const prefetchComponents = (components: string[]) => {
  components.forEach(prefetchComponent);
};

// Component type mapping for skeleton selection
const componentTypeMap: Record<string, string> = {
  Dashboard: 'dashboard',
  StaffDashboard: 'dashboard',
  DataSiswa: 'table',
  DataKelas: 'table',
  Transaksi: 'form',
  Laporan: 'table',
  RiwayatHarian: 'table',
  AuditLogs: 'table',
  Pengguna: 'table',
  DataSekolah: 'form',
  Pengaturan: 'form',
  StaffClassSummary: 'table',
  WaliKelasView: 'dashboard',
  WaliKelasDataSiswa: 'table',
};

// Wrapper component for lazy loaded content
interface LazyWrapperProps {
  children: React.ReactNode;
  skeletonType?: string;
}

export const LazyWrapper = memo(({ children, skeletonType = "table" }: LazyWrapperProps) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback type={skeletonType} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
));
LazyWrapper.displayName = 'LazyWrapper';

// Hook to prefetch on idle
export const usePrefetchOnIdle = (components: string[]) => {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => {
        prefetchComponents(components);
      }, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(() => {
        prefetchComponents(components);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, []);
};
