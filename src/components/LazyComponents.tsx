import React, { Suspense, memo, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Ultra-lightweight loading spinner with skeleton
const LoadingSpinner = memo(() => (
  <div className="flex flex-col items-center justify-center h-32 gap-3">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
    <span className="text-xs text-muted-foreground">Memuat...</span>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Component cache to prevent re-imports
const componentCache = new Map<string, Promise<any>>();

// Lazy loaded components with cached imports
const createLazyComponent = (importFn: () => Promise<any>, name: string) => {
  return React.lazy(() => {
    if (!componentCache.has(name)) {
      componentCache.set(name, importFn());
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
  };

  if (imports[component] && !componentCache.has(component)) {
    componentCache.set(component, imports[component]());
  }
};

// Prefetch multiple components at once
export const prefetchComponents = (components: string[]) => {
  components.forEach(prefetchComponent);
};

// Wrapper component for lazy loaded content
interface LazyWrapperProps {
  children: React.ReactNode;
}

export const LazyWrapper = memo(({ children }: LazyWrapperProps) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
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