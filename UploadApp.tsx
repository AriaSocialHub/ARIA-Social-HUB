


import React, { useMemo } from 'react';
import DataUploader from './components/DataUploader';
import { services, serviceMap } from './services/registry';
import EmptyStatePlaceholder from './components/EmptyStatePlaceholder';
import { useData } from './contexts/DataContext';
import { ArrowLeft } from 'lucide-react';
import { UserProfile } from './types';

type View = 'upload' | string;

interface UploadAppProps {
    setView: (view: View) => void;
    contextServiceId?: string | null;
    currentUser: UserProfile | null;
}


const UploadApp: React.FC<UploadAppProps> = ({ setView, contextServiceId, currentUser }) => {
    
    const { servicesData, uploadAndReplaceData } = useData();
    
    const uploadableServices = useMemo(() => {
        const allServices = services.filter(s => s.parser);
        if (contextServiceId) {
            return allServices.filter(s => s.id === contextServiceId);
        }
        return allServices;
    }, [contextServiceId]);

    const headerText = useMemo(() => {
        if (contextServiceId) {
            const service = serviceMap[contextServiceId];
            return `Aggiorna Dati per: ${service?.name || 'Sezione Corrente'}`;
        }
        return "Importa Dati nel Portale";
    }, [contextServiceId]);


    if (uploadableServices.length === 0) {
        return <EmptyStatePlaceholder message="Nessun servizio di caricamento file è attualmente configurato." />;
    }

    const handleUploadSuccess = (serviceId: string, parsedData: Record<string, any[]>, fileName: string) => {
        if (currentUser) {
            uploadAndReplaceData(serviceId, parsedData, fileName, currentUser.name);
        } else {
            alert("Errore: utente non riconosciuto. Impossibile salvare i dati.");
        }
    };

    return (
        <div>
            {contextServiceId && (
                <button 
                    onClick={() => setView(contextServiceId)} 
                    className="btn btn-secondary mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Torna a {serviceMap[contextServiceId]?.name || 'Sezione Precedente'}
                </button>
            )}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">{headerText}</h1>
                <p className="mt-2 text-lg text-gray-600">
                    {contextServiceId 
                        ? 'Carica il file XLSX per aggiornare la sezione.'
                        : 'Carica i file XLSX per aggiungere o aggiornare le sezioni dell\'applicazione.'
                    }
                </p>
            </div>
            <div className={`grid gap-8 items-start ${contextServiceId ? 'max-w-2xl mx-auto' : 'lg:grid-cols-3'}`}>
                {uploadableServices.map(service => {
                    const serviceData = servicesData[service.id];
                    
                    const serviceInfo = serviceData?.fileName ? { 
                        name: serviceData.fileName!,
                        itemCount: Object.values((serviceData.data as Record<string, any[]>) || {}).reduce((sum: number, items: any[]) => sum + (items?.length || 0), 0),
                        categoryCount: Object.keys(serviceData.data || {}).length,
                    } : null;

                    return (
                        <DataUploader
                            key={service.id}
                            serviceId={service.id}
                            title={service.name}
                            description={service.description}
                            parser={service.parser!}
                            onUploadSuccess={handleUploadSuccess}
                            fileInfo={serviceInfo}
                            onViewData={() => setView(service.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default UploadApp;
