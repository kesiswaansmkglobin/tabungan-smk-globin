import React, { Suspense, memo } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Lightweight loading spinner
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Lazy loaded components with prefetch hints
export const LazyDataSekolah = React.lazy(() => import('./DataSekolah'));
export const LazyDataKelas = React.lazy(() => import('./DataKelas'));
export const LazyDataSiswa = React.lazy(() => import('./DataSiswa'));
export const LazyTransaksi = React.lazy(() => import('./Transaksi'));
export const LazyLaporan = React.lazy(() => import('./Laporan'));
export const LazyRiwayatHarian = React.lazy(() => import('./RiwayatHarian'));
export const LazyPengaturan = React.lazy(() => import('./Pengaturan'));
export const LazyPengguna = React.lazy(() => import('./Pengguna'));
export const LazyWaliKelasView = React.lazy(() => import('./WaliKelasView'));
export const LazyWaliKelasDataSiswa = React.lazy(() => import('./WaliKelasDataSiswa'));

// Prefetch function for eager loading
export const prefetchComponent = (component: string) => {
  switch (component) {
    case 'data-sekolah':
      import('./DataSekolah');
      break;
    case 'data-kelas':
      import('./DataKelas');
      break;
    case 'data-siswa':
      import('./DataSiswa');
      break;
    case 'transaksi':
      import('./Transaksi');
      break;
    case 'laporan':
      import('./Laporan');
      break;
    case 'riwayat-harian':
      import('./RiwayatHarian');
      break;
    case 'pengaturan':
      import('./Pengaturan');
      break;
    case 'pengguna':
      import('./Pengguna');
      break;
    case 'wali-kelas-view':
      import('./WaliKelasView');
      break;
    case 'wali-kelas-data-siswa':
      import('./WaliKelasDataSiswa');
      break;
  }
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