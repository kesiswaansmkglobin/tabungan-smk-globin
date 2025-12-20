import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { getVisibleRange } from '@/utils/performance';

interface VirtualTableProps<T> {
  data: T[];
  rowHeight: number;
  containerHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

function VirtualTableInner<T>({
  data,
  rowHeight,
  containerHeight,
  overscan = 5,
  renderRow,
  renderHeader,
  keyExtractor,
  emptyMessage = 'Tidak ada data'
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { start, end } = useMemo(() => {
    return getVisibleRange(scrollTop, containerHeight, rowHeight, data.length, overscan);
  }, [scrollTop, containerHeight, rowHeight, data.length, overscan]);

  const visibleItems = useMemo(() => {
    return data.slice(start, end + 1);
  }, [data, start, end]);

  const totalHeight = data.length * rowHeight;
  const offsetY = start * rowHeight;

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-card z-10">
          {renderHeader()}
        </thead>
      </table>
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <table 
            className="w-full border-collapse"
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            <tbody>
              {visibleItems.map((item, idx) => (
                <React.Fragment key={keyExtractor(item)}>
                  {renderRow(item, start + idx)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const VirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner;
