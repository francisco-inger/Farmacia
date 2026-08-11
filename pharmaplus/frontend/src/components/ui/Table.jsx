import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = ({ columns, data, onRowClick, pagination, onPageChange }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto custom-scrollbar bg-surface rounded-t-lg border border-border">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted uppercase bg-background sticky top-0 z-10 border-b border-border shadow-sm">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className={`px-4 py-3 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-border/50 hover:bg-primary-light/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''} last:border-0`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface border-x border-b border-border rounded-b-lg">
          <span className="text-sm text-muted">
            Mostrando <span className="font-medium text-main">{data.length}</span> de <span className="font-medium text-main">{pagination.total}</span> resultados
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1 rounded text-muted hover:text-main hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-main px-2">
              Página {pagination.page}
            </span>
            <button 
              disabled={data.length < pagination.limit} // Simplification for demo
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1 rounded text-muted hover:text-main hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
