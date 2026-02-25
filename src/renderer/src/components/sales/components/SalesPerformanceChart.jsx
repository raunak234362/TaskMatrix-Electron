import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const SalesPerformanceChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#000', opacity: 0.4, fontSize: 10, fontWeight: 900 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#000', opacity: 0.4, fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '2px solid #000',
                        boxShadow: '4px 4px 0px #000',
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default SalesPerformanceChart;
