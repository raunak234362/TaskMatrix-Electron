import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import PropTypes from "prop-types";

const FabricatorProjectChart = ({
    data,
    fabricators,
}) => {
    // Theme colors consistent with the website (Greens, Teals, Blues)
    const colors = [
        "#16a34a", // green-600
        "#22c55e", // green-500
        "#4ade80", // green-400
        "#86efac", // green-300
        "#15803d", // green-700
        "#14532d", // green-900
        "#bbf7d0", // green-200
        "#059669", // emerald-600
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                    Fabricator Projects Overview
                </h3>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                padding: "12px"
                            }}
                            labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: '8px' }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '20px' }}
                        />
                        {fabricators.map((fab, index) => (
                            <Bar
                                key={fab}
                                dataKey={fab}
                                stackId="a"
                                fill={colors[index % colors.length]}
                                radius={index === fabricators.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                barSize={30}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {(!data || data.length === 0) && (
                <div className="flex flex-col items-center justify-center -mt-40 pointer-events-none">
                    <p className="text-gray-400 text-sm">No data available for chart</p>
                </div>
            )}
        </div>
    );
};

FabricatorProjectChart.propTypes = {
    data: PropTypes.array.isRequired,
    fabricators: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default FabricatorProjectChart;
