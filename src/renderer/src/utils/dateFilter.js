export const matchesDateFilter = (dateStr, dateFilter) => {
  if (!dateFilter || dateFilter.type === 'all') return true
  if (!dateStr) return false

  const date = new Date(dateStr)
  const { type } = dateFilter

  switch (type) {
    case 'month':
      return date.getMonth() === dateFilter.month && date.getFullYear() === dateFilter.year
    case 'year':
      return date.getFullYear() === dateFilter.year
    case 'week':
      return date.getTime() >= dateFilter.weekStart && date.getTime() <= dateFilter.weekEnd
    case 'range':
      return (
        date.getFullYear() === dateFilter.year &&
        date.getMonth() >= dateFilter.startMonth &&
        date.getMonth() <= dateFilter.endMonth
      )
    case 'dateRange': {
      const start = new Date(dateFilter.startDate)
      const end = new Date(dateFilter.endDate)
      // Set hours to 0 to compare dates only
      date.setHours(0, 0, 0, 0)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
    }
    case 'specificDate': {
      const target = new Date(dateFilter.date)
      date.setHours(0, 0, 0, 0)
      target.setHours(0, 0, 0, 0)
      return date.getTime() === target.getTime()
    }
    default:
      return true
  }
}
