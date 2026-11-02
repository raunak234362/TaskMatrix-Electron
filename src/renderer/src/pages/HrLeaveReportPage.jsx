import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import Service from '../api/Service'
import { extractList } from '../components/manageTeam/leaveUtils'

const getId = (employee) => employee?.id ?? employee?._id ?? employee?.userId
const getName = (employee) => [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || employee?.name || employee?.username || employee?.email || 'Employee'
const number = (value) => Number(value ?? 0) || 0
const reportRows = (report) => extractList(report, ['rows', 'report', 'items'])
const reportSummary = (report) => report?.summary || report?.data?.summary || {}

export default function HrLeaveReportPage() {
  const now = new Date()
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [period, setPeriod] = useState('month')
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    Service.FetchAllEmployee().then((response) => setEmployees(extractList(response, ['employees', 'items'])))
      .catch((error) => toast.error(error?.response?.data?.message || 'Unable to load employees.'))
  }, [])

  const loadReport = useCallback(async () => {
    if (!employeeId) { setReport(null); return }
    setLoading(true)
    try {
      const data = await Service.GetLeaveReport({
        employeeId: employeeId === 'ALL' ? undefined : employeeId,
        month: period === 'month' ? month : undefined,
        year
      })
      setReport(data?.data ?? data)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load the leave report.')
    } finally { setLoading(false) }
  }, [employeeId, period, month, year])

  useEffect(() => { loadReport() }, [loadReport])
  const rows = useMemo(() => reportRows(report), [report])
  const summary = reportSummary(report)
  const employee = employees.find((item) => String(getId(item)) === String(employeeId))
  const download = () => {
    const columns = [
      { header: 'Employee', dataKey: 'employee' },
      { header: 'Designation', dataKey: 'designation' },
      { header: 'Paid', dataKey: 'paidDays' },
      { header: 'Sick', dataKey: 'sickDays' },
      { header: 'Casual', dataKey: 'casualDays' },
      { header: 'LOP', dataKey: 'lopDays' },
      { header: 'Total', dataKey: 'totalDays' }
    ]
    const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const periodLabel = period === 'month'
      ? `${new Date(2000, Number(month) - 1).toLocaleString(undefined, { month: 'long' })} ${year}`
      : `Year ${year}`
    document.setFontSize(18)
    document.text('Employee Leave Report', 14, 17)
    document.setFontSize(10)
    document.text(`${periodLabel} · ${employeeId === 'ALL' ? 'All employees' : getName(employee)}`, 14, 24)
    autoTable(document, {
      startY: 30,
      columns,
      body: rows.map((row) => ({
        employee: row.employee || 'Employee',
        designation: row.designation || '—',
        paidDays: number(row.paidDays ?? row.paidTaken),
        sickDays: number(row.sickDays ?? row.sickTaken),
        casualDays: number(row.casualDays ?? row.casualTaken),
        lopDays: number(row.lopDays ?? row.lop),
        totalDays: number(row.totalDays ?? row.leaveTaken) + (row.totalDays == null ? number(row.lopDays ?? row.lop) : 0)
      })),
      foot: [[
        'Overall total',
        '',
        number(summary.paidDays),
        number(summary.sickDays),
        number(summary.casualDays),
        number(summary.lopDays),
        number(summary.totalDays)
      ]],
      showFoot: 'lastPage',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [21, 128, 61] },
      footStyles: { fillColor: [240, 253, 244], textColor: [17, 24, 39], fontStyle: 'bold' }
    })
    const safeName = employeeId === 'ALL'
      ? 'all-employees'
      : getName(employee).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    document.save(`leave-report-${safeName}-${year}-${period === 'month' ? month : 'year'}.pdf`)
  }

  const downloadCalendarExcel = async () => {
    if (!employeeId) return toast.error('Select an employee or all employees first.')
    setCalendarLoading(true)
    try {
      const response = await Service.GetAttendanceCalendar({
        employeeId: employeeId === 'ALL' ? undefined : employeeId,
        month: Number(month),
        year: Number(year)
      })
      const calendar = response?.data ?? response
      const dayHeaders = Array.from({ length: calendar.daysInMonth }, (_, index) => {
        const day = index + 1
        const weekday = new Date(Date.UTC(Number(year), Number(month) - 1, day))
          .toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
        return `${String(day).padStart(2, '0')} ${weekday}`
      })
      const header = ['S.No', 'Employee Code', 'Name', ...dayHeaders, 'Present', 'Absent', 'CL', 'PL', 'SL', 'LOP', 'Total Leave']
      const body = calendar.rows.map((row) => [
        row.serialNumber,
        row.employeeCode,
        row.name,
        ...row.days,
        row.totals.present,
        row.totals.absent,
        row.totals.cl,
        row.totals.pl,
        row.totals.sl,
        row.totals.lop,
        row.totals.totalLeave
      ])
      const totals = calendar.summary
      const overall = [
        'Overall Total',
        '',
        '',
        ...Array(calendar.daysInMonth).fill(''),
        totals.present,
        totals.absent,
        totals.cl,
        totals.pl,
        totals.sl,
        totals.lop,
        totals.totalLeave
      ]
      const monthName = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
        .toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' })
      const sheet = XLSX.utils.aoa_to_sheet([
        ['Monthly Attendance and Leave Calendar'],
        [`${monthName} ${year}${employeeId === 'ALL' ? ' · All employees' : ` · ${getName(employee)}`}`],
        [],
        header,
        ...body,
        overall
      ])
      sheet['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 28 },
        ...Array(calendar.daysInMonth).fill({ wch: 9 }),
        ...Array(7).fill({ wch: 13 })
      ]
      sheet['!autofilter'] = { ref: `A4:${XLSX.utils.encode_col(header.length - 1)}${body.length + 4}` }
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Monthly Calendar')
      const safeName = employeeId === 'ALL'
        ? 'all-employees'
        : getName(employee).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      XLSX.writeFile(workbook, `attendance-leave-calendar-${safeName}-${year}-${String(month).padStart(2, '0')}.xlsx`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to download the monthly calendar.')
    } finally {
      setCalendarLoading(false)
    }
  }

  const metrics = [
    ['Paid leave taken', summary.paidDays ?? summary.paidTaken ?? 0],
    ['Sick leave taken', summary.sickDays ?? summary.sickTaken ?? 0],
    ['Casual leave taken', summary.casualDays ?? summary.casualTaken ?? 0],
    ['LOP taken', summary.lopDays ?? summary.lop ?? 0],
    ['Overall days', summary.totalDays ?? 0]
  ]
  return <main className="mx-auto max-w-6xl space-y-6 p-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Human resources</p><h1 className="mt-1 text-2xl font-bold">Employee leave report</h1><p className="mt-1 text-sm text-gray-500">Review leave usage and download an employee or company wide PDF report.</p></header>
    <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-4">
      <label className="text-sm font-medium">Employee<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2"><option value="">Select employee</option><option value="ALL">All employees</option>{employees.map((item) => <option key={getId(item)} value={getId(item)}>{getName(item)}</option>)}</select></label>
      <label className="text-sm font-medium">Report period<select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2"><option value="month">Month</option><option value="year">Year</option></select></label>
      <label className="text-sm font-medium">Month<select value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleString(undefined, { month: 'long' })}</option>)}</select></label>
      <label className="text-sm font-medium">Year<input type="number" min="2000" max="2200" value={year} onChange={(event) => setYear(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2" /></label>
    </section>
    {loading ? <div className="flex justify-center gap-2 p-12 text-gray-500"><RefreshCw size={16} className="animate-spin" /> Loading report…</div> : employeeId ? <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([label, value]) => <article key={label} className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{value}</p></article>)}</section>
      {period === 'year' && report?.stored && <p className="text-xs text-gray-500">Annual leave records for {year} are saved.</p>}
      <div className="flex flex-wrap justify-end gap-3"><button onClick={downloadCalendarExcel} disabled={calendarLoading || !employeeId} className="inline-flex items-center gap-2 rounded-lg border border-green-700 px-4 py-2.5 text-sm font-bold text-green-800 disabled:opacity-50"><Download size={16} /> {calendarLoading ? 'Preparing Excel…' : 'Download Monthly Calendar Excel'}</button><button onClick={download} disabled={!report} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Download size={16} /> Download PDF Summary</button></div>
    </> : <p className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">Select an employee or all employees to view the leave summary.</p>}
  </main>
}
