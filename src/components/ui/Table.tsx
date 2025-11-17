import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  getRowClassName?: (item: T) => string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  getRowClassName
}: TableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };
  
  if (loading) {
    return (
      <div className="w-full overflow-x-auto" role="region" aria-label="Data table" aria-busy="true">
        <table className="w-full border-collapse">
          <caption className="sr-only">Loading table data</caption>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-[#2c3e50]"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-200">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" aria-label="Loading" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="w-full overflow-x-auto" role="region" aria-label="Data table">
        <table className="w-full border-collapse">
          <caption className="sr-only">Empty table</caption>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-[#2c3e50]"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#7f8c8d]" role="status">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto" role="region" aria-label="Data table" tabIndex={0}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-left text-sm font-semibold text-[#2c3e50] ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                }`}
                onClick={() => handleSort(column.key, column.sortable)}
                {...(column.sortable && {
                  role: 'button',
                  tabIndex: 0,
                  'aria-sort': sortKey === column.key 
                    ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                    : 'none',
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(column.key, column.sortable);
                    }
                  }
                })}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <div className="flex flex-col" aria-hidden="true">
                      <ChevronUp
                        size={14}
                        className={`-mb-1 ${
                          sortKey === column.key && sortDirection === 'asc'
                            ? 'text-[#ffd166]'
                            : 'text-gray-400'
                        }`}
                      />
                      <ChevronDown
                        size={14}
                        className={`-mt-1 ${
                          sortKey === column.key && sortDirection === 'desc'
                            ? 'text-[#ffd166]'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const customClassName = getRowClassName ? getRowClassName(item) : '';
            return (
              <tr
                key={item.id || index}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${customClassName}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-[#2c3e50]">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
