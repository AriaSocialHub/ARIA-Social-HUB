
import React, { useState, useEffect, useCallback } from 'react';
import { BannerItem } from '../types';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';

interface BannerCarouselProps {
    banners: BannerItem[];
    isReadOnly: boolean;
    onEdit: (banner: BannerItem | null) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, isReadOnly, onEdit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % (banners.length || 1));
    }, [banners.length]);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + (banners.length || 1)) % (banners.length || 1));
    };
    
    useEffect(() => {
        if (banners.length > 1) {
            const timer = setInterval(handleNext, 7000); // Auto-scroll every 7 seconds
            return () => clearInterval(timer);
        }
    }, [banners.length, handleNext]);
    
    const currentBanner = banners.length > 0 ? banners[currentIndex] : null;

    if (banners.length === 0 && isReadOnly) {
        return null; // Don't show anything if there are no banners in read-only mode
    }

    return (
        <div className="relative w-full h-80 bg-gray-200 rounded-2xl shadow-lg overflow-hidden group">
            {currentBanner ? (
                <>
                    <img
                        src={currentBanner.imageUrl}
                        alt={currentBanner.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                        style={{ transform: `scale(1)` }}
                        key={currentBanner.id}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 text-white">
                        <h2 className="text-3xl font-bold mb-2 drop-shadow-md">{currentBanner.title}</h2>
                        <p className="text-lg drop-shadow-md">{currentBanner.description}</p>
                        {currentBanner.link && (
                            <a href={currentBanner.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                Scopri di più
                            </a>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <h2 className="text-2xl font-bold">Benvenuto nel Portale Digital!</h2>
                    <p className="mt-2">L'amministratore può aggiungere qui un banner per le comunicazioni importanti.</p>
                </div>
            )}

            {!isReadOnly && (
                <button
                    onClick={() => onEdit(null)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                    title="Gestisci Banner"
                >
                    <Edit className="h-5 w-5" />
                </button>
            )}

            {banners.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition opacity-0 group-hover:opacity-100">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {banners.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-3 h-3 rounded-full cursor-pointer transition-all ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50'}`}
                            ></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BannerCarousel;
