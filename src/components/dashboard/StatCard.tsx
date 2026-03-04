import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: number; // % change vs previous period
    accentColor?: string;
}

export function StatCard({ label, value, description, icon: Icon, trend, accentColor = "#1A6CC8" }: StatCardProps) {
    const isPositive = trend !== undefined && trend >= 0;
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: accentColor + "15" }}
                >
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-[#0D2D5A] mb-1">{value}</div>
            <div className="text-sm font-semibold text-gray-600">{label}</div>
            {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
        </div>
    );
}
