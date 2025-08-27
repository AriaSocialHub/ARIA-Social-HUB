import React, { useEffect, useRef } from 'react';
import { calculateAllMetrics } from './helpers';
import { CommentPost } from '../../types';

declare const Chart: any;

const VelocityChart: React.FC<{ metrics: ReturnType<typeof calculateAllMetrics>; post: CommentPost }> = ({ metrics, post }) => {
    const chartInstance = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !metrics.calculatedPoints || metrics.calculatedPoints.length === 0) {
            if(chartInstance.current) chartInstance.current.destroy();
            return;
        }

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const { calculatedPoints, linearRegression } = metrics;
        
        const dataForChart = calculatedPoints.map(p => ({
            x: new Date(p.timestamp).getTime(),
            y: p.velocityPerMinute
        }));

        let regressionData: { x: number; y: number }[] = [];
        if (linearRegression && calculatedPoints.length > 1) {
            regressionData = calculatedPoints.map(p => {
                const timeSincePublication = (new Date(p.timestamp).getTime() - new Date(post.publicationDate).getTime()) / (1000 * 60);
                return {
                    x: new Date(p.timestamp).getTime(),
                    y: Math.max(0, linearRegression.slope * timeSincePublication + linearRegression.intercept)
                };
            });
        }
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Velocità (comm/min)',
                        data: dataForChart,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6',
                    },
                    ...(regressionData.length > 0 ? [{
                        label: 'Trend (Regressione)',
                        data: regressionData,
                        borderColor: '#f97316',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                    }] : []),
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            tooltipFormat: 'dd/MM/yy HH:mm',
                            displayFormats: { hour: 'HH:mm', day: 'dd MMM' }
                        },
                        title: { display: true, text: 'Ora Rilevazione', color: '#4b5563' },
                        ticks: { color: '#4b5563' },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Commenti / minuto', color: '#4b5563' },
                        ticks: { color: '#4b5563' },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                },
                plugins: {
                    legend: { position: 'top', labels: { color: '#1f2937' } },
                    tooltip: { mode: 'index', intersect: false, backgroundColor: '#111827' },
                },
            },
        });

        return () => chartInstance.current?.destroy();
    }, [metrics, post.publicationDate]);

    if (!metrics.calculatedPoints || metrics.calculatedPoints.length < 2) {
        return <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg text-gray-500">Servono almeno due rilevazioni per mostrare il grafico.</div>;
    }

    return <canvas ref={canvasRef}></canvas>;
};

export default VelocityChart;
