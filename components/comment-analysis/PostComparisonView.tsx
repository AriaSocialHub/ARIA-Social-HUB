import React, { useRef, useMemo, useEffect } from 'react';
import { CommentAnalysisData, CommentPost } from '../../types';
import { calculateAllMetrics, btnSecondary, card } from './helpers';
import { ArrowLeft } from 'lucide-react';

declare const Chart: any;

const PostComparisonView: React.FC<{ posts: CommentAnalysisData; onBack: () => void }> = ({ posts, onBack }) => {
    const chartInstance = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

    const { chartData, tableData, maxTime } = useMemo(() => {
        const datasets: any[] = [];
        const allTableData: any[] = [];
        let globalMaxTime = 0;

        posts.forEach((post, index) => {
            const metrics = calculateAllMetrics(post);
            const color = colors[index % colors.length];

            const points = metrics.calculatedPoints.map(p => {
                const timeSincePublication = (new Date(p.timestamp).getTime() - new Date(post.publicationDate).getTime()) / (1000 * 60);
                if (timeSincePublication > globalMaxTime) globalMaxTime = timeSincePublication;
                return {
                    x: timeSincePublication,
                    y: p.velocityPerMinute
                };
            });

            datasets.push({
                label: post.name,
                data: points,
                borderColor: color,
                backgroundColor: `${color}1A`, // transparent version
                tension: 0.1,
            });
            const totalComments = post.dataPoints.length > 0 ? [...post.dataPoints].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].totalComments : 0;
            allTableData.push({
                id: post.id,
                name: post.name,
                color: color,
                peak: metrics.peakVelocityPerMinute,
                average: metrics.averageVelocityPerMinute,
                total: totalComments,
            });
        });

        return { chartData: { datasets }, tableData: allTableData, maxTime: globalMaxTime };
    }, [posts]);

    useEffect(() => {
        if (!canvasRef.current || !chartData) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Minuti dalla pubblicazione' },
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Commenti / minuto' },
                    },
                },
                plugins: {
                    tooltip: { mode: 'index', intersect: false },
                },
            },
        });
        return () => chartInstance.current?.destroy();
    }, [chartData]);
    
    return (
        <div className="space-y-6">
            <button onClick={onBack} className={btnSecondary}><ArrowLeft className="w-4 h-4"/> Torna alla lista</button>
            <div className={card}>
                <h2 className="text-2xl font-bold">Confronto Post</h2>
                <div className="mt-4 h-96 w-full">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
            <div className={card}>
                 <h3 className="text-lg font-bold mb-4">Riepilogo Metriche</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-3">Post</th>
                                <th className="px-4 py-3 text-right">Commenti totali</th>
                                <th className="px-4 py-3 text-right">Velocità media (c/min)</th>
                                <th className="px-4 py-3 text-right">Picco velocità (c/min)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map(data => (
                                <tr key={data.id} className="border-b">
                                    <td className="px-4 py-3 font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
                                            {data.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">{data.total}</td>
                                    <td className="px-4 py-3 text-right">{data.average.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-bold">{data.peak.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
}

export default PostComparisonView;
