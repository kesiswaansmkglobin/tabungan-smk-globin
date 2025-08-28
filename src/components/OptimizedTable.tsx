import React, { useMemo, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { debounce } from '@/utils/performance';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchFields?: (keyof T)[];
  pageSize?: number;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function OptimizedTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchFields = [],
  pageSize = 50,
  className = '',
  onRowClick
}: OptimizedTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search to improve performance
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!search) return data;
    
    return data.filter(item => {
      const searchLower = search.toLowerCase();
      
      // Search in specified fields or all string fields
      const fieldsToSearch = searchFields.length > 0 
        ? searchFields 
        : Object.keys(item).filter(key => typeof item[key] === 'string') as (keyof T)[];
      
      return fieldsToSearch.some(field => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(searchLower);
      });
    });
  }, [data, search, searchFields]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginated data for performance
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const SortIcon = ({ field }: { field: keyof T }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari data..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse bg-card">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`text-left p-4 font-medium text-sm ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/70 select-none' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && <SortIcon field={column.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={`border-b border-border hover:bg-muted/30 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4 text-sm">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Tidak ada data yang ditemukan
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} dari {sortedData.length} data
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="px-4 py-2 text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(OptimizedTable);