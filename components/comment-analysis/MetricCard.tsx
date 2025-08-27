import React from 'react';
import { card } from './helpers';

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode, subtext?: string; trend?: {icon: React.ElementType, color: string, text: string} }> = ({ title, value, icon, subtext, trend }) => (
    <div className={`${card} flex-1 flex flex-col items-center justify-center p-4 min-h-[160px]`}>
        <div className="flex items-center gap-2 text-gray-500">
            {icon}
            <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <p className="text-4xl font-bold text-gray-800 my-2">{value}</p>
        {trend ? (
             <div className={`flex items-center gap-1.5 text-base font-semibold ${trend.color}`}>
                <trend.icon className="w-5 h-5" /> 
                <span>{trend.text}</span>
            </div>
        ) : subtext ? <p className="text-sm text-gray-500">{subtext}</p> : <div className="h-6"></div>}
    </div>
);

export default MetricCard;
