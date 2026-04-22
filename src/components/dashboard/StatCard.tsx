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
        <div className="bg-white rounded-2xl p-5 shadow-none border border-slate-100 transition-all hover:bg-slate-50/30">
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50"
                >
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-black text-[#0D2D5A] tracking-tighter mb-0.5">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</div>
            {description && <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{description}</div>}
        </div>
    );
}
