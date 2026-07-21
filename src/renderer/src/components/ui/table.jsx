/* eslint-disable react/prop-types */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "./button";
import Select from "../fields/Select";

/* -------------------- screen hook -------------------- */
function useScreen() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

/* -------------------- filters -------------------- */
function TextFilter({ column }) {
  return (
    <input
      value={column.getFilterValue() ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      className="w-full mt-1 border text-md border-gray-200 dark:border-slate-700 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200"
      placeholder="Filter..."
    />
  );
}

/* -------------------- column filter -------------------- */
function getFilterLabel(column) {
  const header = column.columnDef.header;
  if (typeof header === 'string') return header;
  const key = column.columnDef.accessorKey || column.id || '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function ColumnFilter({ column }) {
  const columnDef = column.columnDef;
  const { filterType, filterOptions } = columnDef;
  const cleanLabel = getFilterLabel(column);

  let filterElement = null;

  if (filterType === "select") {
    filterElement = (
      <select
        value={column.getFilterValue() ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm h-[38px] appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-size-[0.65rem_auto] bg-position-[right_0.75rem_center] bg-no-repeat"
      >
        <option value="">{`ALL ${cleanLabel}`.toUpperCase()}</option>
        {filterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label.toUpperCase()}
          </option>
        ))}
      </select>
    );
  } else if (filterType === "date") {
    filterElement = (
      <input
        type="date"
        value={column.getFilterValue() ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
      />
    );
  } else {
    filterElement = (
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-600 transition-colors" />
        <input
          value={column.getFilterValue() ?? ""}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none pl-9 pr-3 py-2 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all placeholder:text-gray-500 placeholder:font-normal shadow-sm"
          placeholder={`Search ${cleanLabel}...`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{cleanLabel}</label>
      {filterElement}
    </div>
  );
}

/* -------------------- mobile card view -------------------- */
function MobileCardView({ table, DetailComponent, onRowClick }) {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-3">
      {table.getPaginationRowModel().rows.map((row) => {
        const isOpen = open === row.id;
        return (
          <div
            key={row.id}
            className="border border-gray-100 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm cursor-pointer"
            onClick={() => onRowClick?.(row.original)}
          >
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id} className="flex justify-between py-1 text-sm">
                <span className="text-gray-500 dark:text-slate-400">
                  {cell.column.columnDef.header}
                </span>
                <span className="font-medium text-gray-800 dark:text-slate-200">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              </div>
            ))}

            {DetailComponent && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(isOpen ? null : row.id);
                  }}
                  className="mt-2 text-green-600 dark:text-green-500 text-sm"
                >
                  {isOpen ? "Hide details" : "View details"}
                </button>

                {isOpen && (
                  <div
                    className="mt-2 bg-gray-50 dark:bg-slate-800 p-2 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DetailComponent
                      row={row.original}
                      close={() => setOpen(null)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- main table -------------------- */
export default function DataTable({
  columns: userColumns,
  data,
  onRowClick,
  detailComponent: DetailComponent,

  pageSizeOptions = [25, 50],
  showColumnFiltersInHeader = false,
  initialSorting = [],

  // Custom additions for bulk delete functionality (not in original user snippet but necessary)
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange = () => { },
  getRowId,
  getRowClassName = () => "",
  forceExpandRowId = null,
  meta,
}) {
  const { isMobile } = useScreen();

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(initialSorting);
  const [columnFilters, setColumnFilters] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    if (forceExpandRowId) {
      setExpandedRowId(forceExpandRowId);
    }
  }, [forceExpandRowId]);

  const columns = useMemo(() => {
    const sNoCol = {
      id: "sNo",
      header: "S.No",
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        const index = table
          .getPaginationRowModel()
          .rows.findIndex((r) => r.id === row.id);
        return <span>{pageIndex * pageSize + index + 1}</span>;
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 50,
      minSize: 50,
    };

    const selectionCol = {
      id: "select",
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    };

    const baseColumns = [sNoCol, ...userColumns];

    if (enableRowSelection) {
      return [selectionCol, ...baseColumns];
    }
    return baseColumns;
  }, [userColumns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns,
    meta,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      sorting: initialSorting,
      pagination: {
        pageSize: pageSizeOptions[0] || 10,
      },
      // Ensure rowSelection is valid even if undefined
      rowSelection: rowSelection || {},
    },
    enableRowSelection,
    onRowSelectionChange,
    getRowId,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      {/* toolbar */}
      {/* <div className="flex flex-col md:flex-row justify-between gap-3 mb-4 px-4 pt-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm"
          />
        </div>
      </div> */}

      {/* Filter Bar */}
      {table
        .getAllColumns()
        .some((c) => c.columnDef.enableColumnFilter) && (
          <div className="flex flex-wrap items-end gap-5 mb-4 py-2 animate-in slide-in-from-top-2 duration-300">
            {table
              .getAllColumns()
              .filter((c) => c.columnDef.enableColumnFilter)
              .map((column) => (
                <div
                  key={column.id}
                  className="min-w-[240px]"
                >
                  <ColumnFilter column={column} />
                </div>
              ))}
            <button
              onClick={() => table.resetColumnFilters()}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-normal shadow-sm flex items-center"
            >
              <X className="w-4 h-4 mr-2 text-black" /> Clear Filters
            </button>
          </div>
        )}
 
      {/* responsive body */}
      {isMobile ? (
        <MobileCardView
          table={table}
          DetailComponent={DetailComponent}
          onRowClick={onRowClick}
        />
      ) : (
        <div className="w-full">
          <div className="max-h-[800px] overflow-y-auto overflow-x-auto">
            <table className="min-w-full divide-y-0">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-normal bg-green-100 text-black border-b border-black/5"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1 cursor-pointer">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp className="w-4 h-4" />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
 
                        {showColumnFiltersInHeader &&
                          header.column.getCanFilter() && (
                            <TextFilter column={header.column} />
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
 
              <tbody className="bg-white text-black divide-y divide-gray-100">
                {table.getPaginationRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`hover:bg-green-50 cursor-pointer transition-colors ${expandedRowId === row.id ? "bg-gray-50" : ""
                        } ${getRowClassName(row.original)}`}
                      onClick={() => {
                        onRowClick?.(row.original);
                        if (DetailComponent) {
                          setExpandedRowId(
                            expandedRowId === row.id ? null : row.id,
                          );
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4 text-sm font-normal text-black">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedRowId === row.id && DetailComponent && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={columns.length} className="px-4 py-4">
                          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-black">
                            <DetailComponent
                               row={row.original}
                               close={() => setExpandedRowId(null)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* pagination */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm p-4 border-gray-50 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="text-black font-semibold text-sm uppercase">
            PAGE {table.getState().pagination.pageIndex + 1} OF{" "}
            {table.getPageCount()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50 text-black font-semibold text-sm"
          >
            {"<"}
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50 text-black font-semibold text-sm"
          >
            {">"}
          </Button>
        </div>
      </div>
    </>
  );
}
