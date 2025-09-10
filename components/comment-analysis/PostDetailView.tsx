import React, { useState, useMemo } from 'react';
import { CommentPost, CommentDataPoint } from '../../types';
import { btnPrimary, btnSecondary, card, calculateAllMetrics, getTrendInfo, getPlatformIcon } from './helpers';
import MetricCard from './MetricCard';
import VelocityChart from './VelocityChart';
import DataPointModal from './DataPointModal';
import { ArrowLeft, Tag, Rocket, BarChartHorizontal, PieChart, Edit, Trash2 } from 'lucide-react';


const PostDetailView: React.FC<{ post: CommentPost; onBack: () => void; onUpdatePost: (post: CommentPost) => void; isReadOnly: boolean }> = ({ post, onBack, onUpdatePost, isReadOnly }) => {
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [editingDataPoint, setEditingDataPoint] = useState<CommentDataPoint | null>(null);
    const metrics = useMemo(() => calculateAllMetrics(post), [post]);

    const handleOpenDataModal = (point: CommentDataPoint | null) => {
        setEditingDataPoint(point);
        setIsDataModalOpen(true);
    };
    
    const handleSaveDataPoint = (pointData: CommentDataPoint, originalTimestamp?: string) => {
        let updatedDataPoints;
        if (originalTimestamp) { // Editing
            updatedDataPoints = post.dataPoints.map(p => p.timestamp === originalTimestamp ? pointData : p);
        } else { // Adding
            updatedDataPoints = [...post.dataPoints, pointData];
        }
        onUpdatePost({ ...post, dataPoints: updatedDataPoints });
    };

    const handleDeleteDataPoint = (timestamp: string) => {
        if (isReadOnly) return;
        if(window.confirm('Sei sicuro di voler eliminare questa rilevazione?')) {
             onUpdatePost({ ...post, dataPoints: post.dataPoints.filter(p => p.timestamp !== timestamp) });
        }
    };

    const TrendInfo = getTrendInfo(metrics.trend);
    const totalComments = post.dataPoints.length > 0 ? [...post.dataPoints].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].totalComments : 0;
    
    return (
        <div className="space-y-6">
            <button onClick={onBack} className={btnSecondary}><ArrowLeft className="w-4 h-4"/> Torna alla lista</button>
            <div className={card}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{post.name}</h2>
                        <p className="text-gray-500 flex items-center gap-2">{getPlatformIcon(post.platform)} {post.platform} - Pubblicato il {new Date(post.publicationDate).toLocaleString('it-IT')}</p>
                    </div>
                    {post.correlationTag && <div className="flex items-center gap-2 text-sm bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full"><Tag className="w-4 h-4" /> {post.correlationTag}</div>}
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6">
                 <MetricCard title="Velocità Recente" value={metrics.recentVelocityPerMinute.toFixed(2)} icon={<Rocket className="w-5 h-5"/>} subtext="comm/minuto" trend={TrendInfo} />
                 <MetricCard title="Picco" value={metrics.peakVelocityPerMinute.toFixed(2)} icon={<BarChartHorizontal className="w-5 h-5"/>} subtext="comm/minuto" />
                 <MetricCard title="Commenti Totali" value={totalComments.toString()} icon={<PieChart className="w-5 h-5"/>} />
            </div>

            <div className={`${card} space-y-4`}>
                <h3 className="text-lg font-bold">Andamento Velocità</h3>
                <div className="h-80 w-full">
                    <VelocityChart metrics={metrics} post={post} />
                </div>
            </div>
            
             <div className={card}>
                <h3 className="text-lg font-bold mb-2">Previsione e Analisi</h3>
                <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: metrics.prediction }}></p>
            </div>
            
            <div className={card}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold">Rilevazioni ({post.dataPoints.length})</h3>
                    {!isReadOnly && <button className={btnPrimary} onClick={() => handleOpenDataModal(null)}>Aggiungi Rilevazione</button>}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-3">Ora Rilevazione</th>
                                <th className="px-4 py-3">Commenti Totali</th>
                                <th className="px-4 py-3 font-semibold">Velocità (c/min)</th>
                                {!isReadOnly && <th className="px-4 py-3 text-right">Azioni</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[...metrics.calculatedPoints].reverse().map(p => (
                                <tr key={p.timestamp} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-800">{new Date(p.timestamp).toLocaleString('it-IT')}</td>
                                    <td className="px-4 py-3 text-gray-800">{p.totalComments}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{p.velocityPerMinute.toFixed(2)}</td>
                                    {!isReadOnly && (
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleOpenDataModal(p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Modifica"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteDataPoint(p.timestamp)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Elimina"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isDataModalOpen && <DataPointModal post={post} dataPoint={editingDataPoint} onClose={() => setIsDataModalOpen(false)} onSave={handleSaveDataPoint} />}
        </div>
    );
};

export default PostDetailView;