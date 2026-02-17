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
      className="w-full mt-1 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200"
      placeholder="Filter..."
    />
  );
}

/* -------------------- column filter -------------------- */
function ColumnFilter({ column }) {
  const columnDef = column.columnDef;
  const { filterType, filterOptions, header } = columnDef;

  if (filterType === "select") {
    return (
      <Select
        options={filterOptions}
        value={column.getFilterValue()}
        onChange={(_, val) => column.setFilterValue(val || undefined)}
        placeholder={`All ${header}`}
        className="py-1! text-xs!"
      />
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
      <input
        value={column.getFilterValue() ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="pl-8 pr-2 py-1.5 w-full border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200"
        placeholder={`Search ${header}...`}
      />
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
  onRowSelectionChange = () => {},
  getRowId,
}) {
  const { isMobile } = useScreen();

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(initialSorting);
  const [columnFilters, setColumnFilters] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

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
          <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            {table
              .getAllColumns()
              .filter((c) => c.columnDef.enableColumnFilter)
              .map((column) => (
                <div
                  key={column.id}
                  className="flex flex-col gap-1.5 min-w-[180px]"
                >
                  <label className="text-md  text-gray-500  uppercase tracking-widest ml-1">
                    {column.columnDef.header}
                  </label>
                  <ColumnFilter column={column} />
                </div>
              ))}
            <Button
              onClick={() => table.resetColumnFilters()}
              className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors h-9 px-2"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
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
        <div className="w-full border border-gray-100 rounded-lg overflow-hidden">
          <div className="max-h-[800px] overflow-y-auto overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-md md:text-lg font-medium bg-gray-200 text-gray-700"
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
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${expandedRowId === row.id ? "bg-gray-50" : ""
                        }`}
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
                        <td key={cell.id} className="px-4 py-3 text-md md:text-lg text-gray-800">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedRowId === row.id && DetailComponent && (
                      <tr className="bg-gray-50/50 dark:bg-slate-800/30">
                        <td colSpan={columns.length} className="px-4 py-4">
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 text-gray-800 dark:text-slate-300">
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm p-4 border-t border-gray-50 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-slate-400">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="px-3 py-1 border border-gray-200 dark:border-slate-700 rounded disabled:opacity-50 text-gray-700 dark:text-slate-300"
          >
            {"<"}
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="px-3 py-1 border border-gray-200 dark:border-slate-700 rounded disabled:opacity-50 text-gray-700 dark:text-slate-300"
          >
            {">"}
          </Button>
        </div>
      </div>
    </>
  );
}
