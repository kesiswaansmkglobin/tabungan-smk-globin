import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy loaded components for better bundle splitting
export const LazyDataSekolah = React.lazy(() => import('./DataSekolah'));
export const LazyDataKelas = React.lazy(() => import('./DataKelas'));
export const LazyDataSiswa = React.lazy(() => import('./DataSiswa'));
export const LazyTransaksi = React.lazy(() => import('./Transaksi'));
export const LazyLaporan = React.lazy(() => import('./Laporan'));
export const LazyRiwayatHarian = React.lazy(() => import('./RiwayatHarian'));
export const LazyPengaturan = React.lazy(() => import('./Pengaturan'));

// HOC for wrapping lazy components
export const withLazyLoading = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};