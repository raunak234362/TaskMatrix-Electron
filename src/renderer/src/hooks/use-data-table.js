import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useState } from 'react'

export function useDataTable({ data, columns, initialState }) {
  const [sorting, setSorting] = useState(initialState?.sorting || [])
  const [columnFilters, setColumnFilters] = useState(initialState?.columnFilters || [])
  const [columnVisibility, setColumnVisibility] = useState(initialState?.columnVisibility || {})
  const [pagination, setPagination] = useState(
    initialState?.pagination || { pageIndex: 0, pageSize: 10 }
  )
  const [globalFilter, setGlobalFilter] = useState(initialState?.globalFilter || '')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return {
    table,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter
  }
}
