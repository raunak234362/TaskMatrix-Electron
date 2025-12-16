/* eslint-disable @typescript-eslint/no-explicit-any */
// components/DataTable.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "./button";
import Select from "../fields/Select";

// ---------------------------------------------------------------
// 1. Filter UI Components
// ---------------------------------------------------------------


// Indeterminate checkbox component for header select-all
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
  title,
  ariaLabel,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
      aria-label={ariaLabel}
      title={title}
    />
  );
}

function TextFilter({ column }) {
  const value = column.getFilterValue();
  return (
    <div className="relative mt-1">
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder={`Filter...`}
        className="w-full pl-8 pr-7 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
      />
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      {value && (
        <Button
          onClick={() => column.setFilterValue(undefined)}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function SelectFilter({
  column,
  options,
}) {
  const value = column.getFilterValue();

  return (
    <div className="mt-1">
      <Select
        name={column.id}
        options={options}
        value={value}
        onChange={(_, value) => column.setFilterValue(value || undefined)}
        placeholder="All"
        className="text-xs"
      />
    </div>
  );
}

function MultiSelectFilter({
  column,
  options,
}) {
  const value = (column.getFilterValue()) ?? [];

  const toggle = (val) => {
    const newVal = value.includes(val)
      ? value.filter((v) => v !== val)
      : [...value, val];
    column.setFilterValue(newVal.length ? newVal : undefined);
  };

  return (
    <div className="mt-1 max-h-40 overflow-auto border border-gray-300 rounded bg-white">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer text-xs"
        >
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="w-3 h-3 text-teal-600 rounded"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// 2. Column Definition Extensions
// ---------------------------------------------------------------


export default function DataTable({
  columns: userColumns,
  data,
  onRowClick,
  detailComponent: DetailComponent,
  onDelete,
  searchPlaceholder = "Search...",
  pageSizeOptions = [10, 25, 50, 100],
  showColumnToggle = true,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Add selection column
  const columns = useMemo(() => {
    const selectionColumn = {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
          ariaLabel="Select all rows on page"
          title="Select all rows on page"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
          aria-label="Select row"
          title="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      size: 50,
    };

    return [selectionColumn, ...userColumns];
  }, [userColumns]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;
  const selectedRows = table
    .getSelectedRowModel()
    .flatRows.map((r) => r.original);

  const handleDelete = () => {
    onDelete?.(selectedRows);
    setRowSelection({});
    setShowDeleteModal(false);
  };

  const toggleRowExpand = (rowId) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  // Render filter based on column config
  const renderFilter = (column) => {
    const def = column.columnDef;

    // 1. Explicitly disabled → no filter
    if (def.enableColumnFilter === false) return null;

    // 2. No filterType AND enableColumnFilter not true → no filter
    if (!def.filterType && def.enableColumnFilter !== true) return null;

    // 3. Custom component
    if (def.filterComponent) {
      const Comp = def.filterComponent;
      return <Comp column={column} />;
    }

    // 4. Built-in filters
    switch (def.filterType) {
      case "select":
        return (
          <SelectFilter column={column} options={def.filterOptions ?? []} />
        );
      case "multiselect":
        return (
          <MultiSelectFilter
            column={column}
            options={def.filterOptions ?? []}
          />
        );
      default:
        // text filter (default when enableColumnFilter: true)
        return <TextFilter column={column} />;
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {showColumnToggle && (
            <div className="relative group">
              <button className="flex items-center text-gray-800 gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Columns
              </button>
              <div className="absolute text-gray-800 right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                <div className="p-2 max-h-60 overflow-auto">
                  {table.getAllColumns().map((column) => {
                    if (!column.getCanHide()) return null;
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={() => column.toggleVisibility()}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span>{column.columnDef.header?.toString()}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {/* Header + sort */}
                    <div
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none flex items-center gap-1"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "desc" ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : header.column.getIsSorted() === "asc" ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : null}
                    </div>

                    {/* Filter */}
                    {renderFilter(header.column)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleFlatColumns().length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`hover:bg-teal-50 transition-colors ${onRowClick ? "cursor-pointer" : ""
                        }`}
                      onClick={() => {
                        onRowClick?.(row.original);
                        if (DetailComponent) toggleRowExpand(row.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="text-left px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}

                      {DetailComponent && (
                        <td className="px-2 py-4">
                          <ChevronRight
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""
                              }`}
                          />
                        </td>
                      )}
                    </tr>

                    {DetailComponent && isExpanded && (
                      <tr>
                        <td
                          colSpan={
                            table.getVisibleFlatColumns().length +
                            (DetailComponent ? 1 : 0)
                          }
                          className="bg-gray-50 p-0"
                        >
                          <div className=" overflow-y-auto p-4">
                            <DetailComponent row={row.original} close={() => toggleRowExpand(row.id)} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong>
          </span>
          <span>|</span>
          <label htmlFor="page-size-select" className="sr-only">
            Rows per page
          </label>
          <select
            id="page-size-select"
            aria-label="Rows per page"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="bg-teal-100 text-gray-800 hover:bg-teal-200 px-3 py-1 border rounded disabled:opacity-50"
          >
            {"<<"}
          </Button>
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-teal-100 text-gray-800 hover:bg-teal-200 px-3 py-1 border rounded disabled:opacity-50"
          >
            {"<"}
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-teal-100 text-gray-800 hover:bg-teal-200 px-3 py-1 border rounded disabled:opacity-50"
          >
            {">"}
          </Button>
          <Button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="bg-teal-100 text-gray-800 hover:bg-teal-200 px-3 py-1 border rounded disabled:opacity-50"
          >
            {">>"}
          </Button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              Delete {selectedCount} {selectedCount === 1 ? "Item" : "Items"}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
