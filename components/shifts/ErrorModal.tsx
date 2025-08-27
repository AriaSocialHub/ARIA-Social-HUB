import React from 'react';
import { X } from 'lucide-react';

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
                <h2 className="text-lg font-bold text-red-600">Errore</h2>
                <p className="text-sm text-gray-600 mt-2">{message}</p>
            </div>
        </div>
    );
};

export default ErrorModal;
