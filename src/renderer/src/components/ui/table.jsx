/* eslint-disable @typescript-eslint/no-explicit-any */
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
  MoreHorizontal,
} from "lucide-react";

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
  };
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
        onChange={(_, val) =>
          column.setFilterValue(val || undefined)
        }
        placeholder={`All ${header}`}
        className="py-1! text-xs!"
      />
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
      <input
        value={column.getFilterValue() ?? ""}
        onChange={(e) =>
          column.setFilterValue(e.target.value || undefined)
        }
        className="pl-8 pr-2 py-1.5 w-full border border-gray-200 rounded text-xs outline-none"
        placeholder={`Search ${header}...`}
      />
    </div>
  );
}

/* -------------------- mobile card view -------------------- */
function MobileCardView({ table, onRowClick }) {
  return (
    <div className="space-y-3">
      {table.getRowModel().rows.map((row) => (
        <div
          key={row.id}
          className="rounded-lg p-3 bg-white shadow-sm cursor-pointer"
          onClick={() => onRowClick?.(row.original)}
        >
          {row.getVisibleCells().map((cell) => (
            <div key={cell.id} className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">
                {cell.column.columnDef.header}
              </span>
              <span className="font-medium text-gray-800">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------- main table -------------------- */
export default function DataTable({
  columns: userColumns,
  data,
  onRowClick,
  detailComponent: DetailComponent,
  initialSorting = [],
  disablePagination = false,
}) {
  const { isMobile } = useScreen();

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(initialSorting);
  const [columnFilters, setColumnFilters] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const columns = useMemo(() => {
    const sNoCol = {
      id: "sNo",
      header: "S.No",
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        return pageIndex * pageSize + row.index + 1;
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 60,
    };

    const actionCol = {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRowId(expandedRowId === row.id ? null : row.id);
          }}
        >
          <MoreHorizontal size={16} />
        </button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 50,
    };

    return [sNoCol, ...userColumns, actionCol];
  }, [userColumns, expandedRowId]);

  const table = useReactTable({
    data: safeData,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    initialState: {
      sorting: initialSorting,
      pagination: {
        pageSize: disablePagination ? safeData.length || 1 : 10,
      },
    },
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
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Quick search..."
            className="pl-10 pr-3 py-2 w-full rounded-lg text-sm"
          />
        </div>

        {table
          .getAllColumns()
          .filter((c) => c.columnDef.enableColumnFilter)
          .map((column) => (
            <div key={column.id} className="w-48">
              <ColumnFilter column={column} />
            </div>
          ))}

        <Button onClick={() => table.resetColumnFilters()}>
          Clear
        </Button>
      </div>

      {/* Body */}
      {isMobile ? (
        <MobileCardView table={table} onRowClick={onRowClick} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={14} />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="h-[50vh] ">
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      DetailComponent
                        ? setExpandedRowId(expandedRowId === row.id ? null : row.id)
                        : onRowClick?.(row.original)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {expandedRowId === row.id && DetailComponent && (
                    <tr>
                      <td colSpan={columns.length} className="p-4 bg-gray-50">
                        <DetailComponent
                          row={row.original}
                          close={() => setExpandedRowId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
