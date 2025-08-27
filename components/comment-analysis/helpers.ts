import React, { useEffect, useRef } from 'react';
import { CommentPost, CommentDataPoint } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// --- STYLE CONSTANTS ---
export const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
export const btnSecondary = "inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed";
export const formInput = "block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100";
export const card = "bg-white p-6 rounded-xl shadow-sm border";

// --- METRICS & HELPERS ---
const EMA_ALPHA = 0.3;

export function calculateAllMetrics(post?: CommentPost | null) {
    const defaultMetrics = {
        recentVelocityPerMinute: 0, peakVelocityPerMinute: 0, averageVelocityPerMinute: 0,
        trend: 'stable', prediction: 'Aggiungi almeno una rilevazione per calcolare le metriche.',
        calculatedPoints: [] as (CommentDataPoint & { velocityPerMinute: number })[], 
        linearRegression: null, confidence: 'N/A'
    };

    if (!post || !post.dataPoints || post.dataPoints.length < 1) {
         return { ...defaultMetrics, prediction: 'Servono almeno due rilevazioni per calcolare il trend.' };
    }
    
    if (post.dataPoints.length < 2) {
         const calculatedPoints = post.dataPoints.map(p => ({...p, velocityPerMinute: 0}));
         return { ...defaultMetrics, calculatedPoints, prediction: 'Servono almeno due rilevazioni per calcolare il trend.' };
    }

    const sortedDataPoints = [...post.dataPoints].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const calculatedPoints: (CommentDataPoint & { velocityPerMinute: number })[] = [];
    let peakVelocityPerMinute = 0;

    for (let i = 0; i < sortedDataPoints.length; i++) {
        const currentPoint = sortedDataPoints[i];
        const previousPoint = i === 0 ? { timestamp: post.publicationDate, totalComments: 0 } : sortedDataPoints[i - 1];
        const previousComments = previousPoint.totalComments || 0;
        const timeDiffMinutes = (new Date(currentPoint.timestamp).getTime() - new Date(previousPoint.timestamp).getTime()) / (1000 * 60);
        
        let velocityPerMinute = 0;
        if (timeDiffMinutes > 0) {
            const commentsDiff = currentPoint.totalComments - previousComments;
            velocityPerMinute = commentsDiff / timeDiffMinutes;
        }
        if (velocityPerMinute < 0) velocityPerMinute = 0;

        calculatedPoints.push({ ...currentPoint, velocityPerMinute: velocityPerMinute });
        if (velocityPerMinute > peakVelocityPerMinute) peakVelocityPerMinute = velocityPerMinute;
    }

    const n = calculatedPoints.length;
    const x = calculatedPoints.map(p => (new Date(p.timestamp).getTime() - new Date(post.publicationDate).getTime()) / (1000 * 60)); // X in minutes
    const y = calculatedPoints.map(p => p.velocityPerMinute);
    const sum_x = x.reduce((a, b) => a + b, 0);
    const sum_y = y.reduce((a, b) => a + b, 0);
    const sum_xy = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sum_xx = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    
    const denominator = (n * sum_xx - sum_x * sum_x);
    const slope = denominator !== 0 ? (n * sum_xy - sum_x * sum_y) / denominator : 0;
    const intercept = (sum_y - slope * sum_x) / n || 0;
    const linearRegression = { slope, intercept };
    
    let prediction = '';
    const lastMinutes = x[n - 1];
    const next30MinPrediction = Math.max(0, slope * (lastMinutes + 30) + intercept);
    const trendDirection = slope > 0.001 ? 'up' : slope < -0.001 ? 'down' : 'stable';
    
    let confidence = 'Media';
    const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
    const stdDev = Math.sqrt(residuals.map(r => r*r).reduce((a,b) => a+b, 0) / (n > 2 ? n - 2 : 1));
    const meanY = sum_y / n;

    if (meanY > 0) {
        if (stdDev / meanY > 0.5) confidence = 'Bassa';
        if (stdDev / meanY < 0.2) confidence = 'Alta';
    }

    if (trendDirection === 'down') {
        prediction = `Il trend è in calo. Si prevede una velocità di circa <strong>${next30MinPrediction.toFixed(2)} comm/minuto</strong> tra 30 minuti.`;
        if (slope < -0.001 && intercept > 0) {
             const minutesToZero = -intercept / slope;
             if (minutesToZero > lastMinutes && minutesToZero < lastMinutes + (2 * 24 * 60)) { // within 2 days
                 prediction += ` A questo ritmo, l'attività potrebbe esaurirsi in circa <strong>${((minutesToZero - lastMinutes)/60).toFixed(1)} ore</strong>.`
             }
        }
    } else if (trendDirection === 'up') {
         prediction = `Il post sta accelerando. Prevista una velocità di <strong>${next30MinPrediction.toFixed(2)} comm/minuto</strong> tra 30 minuti.`;
    } else {
        const ema = y.reduce((ema, current) => (current * EMA_ALPHA) + (ema * (1-EMA_ALPHA)), y[0] || 0);
        prediction = `La velocità sembra stabilizzarsi. L'attuale slancio (EMA) è di <strong>${ema.toFixed(2)} comm/minuto</strong>. La previsione a 30 minuti (regressione) è di <strong>${next30MinPrediction.toFixed(2)} comm/minuto</strong>.`;
    }
    prediction += ` (Affidabilità: ${confidence})`;

    const recentVelocityPerMinute = calculatedPoints[n - 1].velocityPerMinute;
    const totalTimeMinutes = (new Date(sortedDataPoints[n-1].timestamp).getTime() - new Date(post.publicationDate).getTime()) / (1000 * 60);
    const averageVelocityPerMinute = totalTimeMinutes > 0 ? sortedDataPoints[n-1].totalComments / totalTimeMinutes : 0;

    return { recentVelocityPerMinute, peakVelocityPerMinute, averageVelocityPerMinute, trend: trendDirection, prediction, calculatedPoints, linearRegression, confidence };
}


export function getLocalISOString() {
    const d = new Date();
    // To make it compatible with datetime-local input, we need YYYY-MM-DDTHH:mm
    const timezoneOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
}

export const getTrendInfo = (trend: string) => {
    switch (trend) {
        case 'up': return { icon: TrendingUp, color: 'text-green-500', text: 'In crescita' };
        case 'down': return { icon: TrendingDown, color: 'text-red-500', text: 'In calo' };
        default: return { icon: Minus, color: 'text-yellow-500', text: 'Stabile' };
    }
};

export const useModalBehavior = (onClose: () => void) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);
    return modalRef;
};
