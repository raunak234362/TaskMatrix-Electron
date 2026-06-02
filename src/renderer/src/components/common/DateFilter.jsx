/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";

const DateFilter = ({ dateFilter, setDateFilter }) => {
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const [localDateFilter, setLocalDateFilter] = useState(dateFilter);

    // Sync local state when dropdown is opened
    useEffect(() => {
        if (showFilterDropdown) {
            setLocalDateFilter(dateFilter);
        }
    }, [showFilterDropdown]);

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 z-99">
            <div className="flex items-center justify-between gap-5">
                <div className="relative">
                    <button
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-900 font-semibold rounded-lg hover:bg-green-100"
                        onClick={() => setShowFilterDropdown((prev) => !prev)}
                        type="button"
                    >
                        <Filter size={16} />
                        {dateFilter?.type === "all"
                            ? "All Time"
                            : dateFilter?.type === "month"
                                ? `${months[dateFilter.month]} ${dateFilter.year}`
                                : dateFilter?.type === "week"
                                    ? `Week of ${new Date(dateFilter.weekStart).toLocaleDateString()}`
                                    : dateFilter?.type === "range"
                                        ? `${months[dateFilter.startMonth]} - ${months[dateFilter.endMonth]} ${dateFilter.year}`
                                        : dateFilter?.type === "dateRange"
                                            ? `${new Date(dateFilter.startDate).toLocaleDateString()} - ${new Date(dateFilter.endDate).toLocaleDateString()}`
                                            : dateFilter?.type === "specificDate"
                                                ? `${new Date(dateFilter.date).toLocaleDateString()}`
                                                : `Year ${dateFilter.year}`}
                        <ChevronDown size={16} />
                    </button>

                    {showFilterDropdown && (
                        <div
                            className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-100"
                            onClick={(e) => e.stopPropagation()} // ✅ prevent auto-close on inside click
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <div className="p-3">
                                {/* Filter Type */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Filter Type
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        value={localDateFilter?.type}
                                        onChange={(e) =>
                                            setLocalDateFilter({ ...localDateFilter, type: e.target.value })
                                        }
                                    >
                                        <option value="all">All Time</option>
                                        <option value="month">By Month</option>
                                        <option value="week">By Week</option>
                                        <option value="year">By Year</option>
                                        <option value="dateRange">Date Range</option>
                                        <option value="range">Month Range</option>
                                        <option value="specificDate">Specific Date</option>
                                    </select>
                                </div>

                                {(localDateFilter?.type === "month" ||
                                    localDateFilter?.type === "year" ||
                                    localDateFilter?.type === "range") && (
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Year
                                            </label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={localDateFilter.year || ""}
                                                onChange={(e) =>
                                                    setLocalDateFilter({
                                                        ...localDateFilter,
                                                        year: Number(e.target.value),
                                                    })
                                                }
                                            >
                                                <option value="">Select Year</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                {localDateFilter?.type === "week" && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Week Starting
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={
                                                localDateFilter.weekStart
                                                    ? new Date(localDateFilter.weekStart)
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const date = new Date(e.target.value);
                                                const dayOfWeek = date.getDay();
                                                const diff = date.getDate() - dayOfWeek;
                                                const weekStart = new Date(date.setDate(diff));
                                                const weekEnd = new Date(weekStart);
                                                weekEnd.setDate(weekEnd.getDate() + 6);
                                                setLocalDateFilter({
                                                    ...localDateFilter,
                                                    weekStart: weekStart.getTime(),
                                                    weekEnd: weekEnd.getTime(),
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                {localDateFilter?.type === "month" && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Month
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={localDateFilter.month || ""}
                                            onChange={(e) =>
                                                setLocalDateFilter({
                                                    ...localDateFilter,
                                                    month: Number(e.target.value),
                                                })
                                            }
                                        >
                                            <option value="">Select Month</option>
                                            {months.map((month, index) => (
                                                <option key={month} value={index}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {localDateFilter?.type === "range" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Month
                                            </label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={localDateFilter.startMonth || ""}
                                                onChange={(e) =>
                                                    setLocalDateFilter({
                                                        ...localDateFilter,
                                                        startMonth: Number(e.target.value),
                                                    })
                                                }
                                            >
                                                <option value="">Select Start</option>
                                                {months.map((month, index) => (
                                                    <option key={month} value={index}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Month
                                            </label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={localDateFilter.endMonth || ""}
                                                onChange={(e) =>
                                                    setLocalDateFilter({
                                                        ...localDateFilter,
                                                        endMonth: Number(e.target.value),
                                                    })
                                                }
                                            >
                                                <option value="">Select End</option>
                                                {months.map((month, index) => (
                                                    <option key={month} value={index}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {localDateFilter?.type === "dateRange" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={
                                                    localDateFilter.startDate
                                                        ? new Date(localDateFilter.startDate)
                                                            .toISOString()
                                                            .split("T")[0]
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    setLocalDateFilter({
                                                        ...localDateFilter,
                                                        startDate: new Date(e.target.value).toISOString(),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={
                                                    localDateFilter.endDate
                                                        ? new Date(localDateFilter.endDate)
                                                            .toISOString()
                                                            .split("T")[0]
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    setLocalDateFilter({
                                                        ...localDateFilter,
                                                        endDate: new Date(e.target.value).toISOString(),
                                                    })
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Specific Date Input */}
                                {localDateFilter?.type === "specificDate" && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={
                                                localDateFilter.date
                                                    ? new Date(localDateFilter.date)
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                setLocalDateFilter({
                                                    ...localDateFilter,
                                                    date: new Date(e.target.value).toISOString(),
                                                })
                                            }
                                        />
                                    </div>
                                )}

                                {/* ✅ Apply Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFilter(localDateFilter);
                                        setShowFilterDropdown(false);
                                    }}
                                    className="mt-2 w-full bg-green-200 hover:bg-green-700 text-black text-sm font-semibold py-2 rounded-md"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DateFilter;
