
import React, { useState, useEffect } from 'react';
import { generateGroundedResponse } from '../services/geminiService';
// Fix: Removed missing Distributor type import
import { Spinner, StoreIcon, WhatsappIcon, MapPin, SearchIcon, PhoneIcon } from './Shared';

interface DistributorFinderProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

type LocationState = { latitude: number; longitude: number } | null;

export const DistributorFinder: React.FC<DistributorFinderProps> = ({ isOpen, onClose, showAlert }) => {
    const [distributors, setDistributors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<LocationState>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null);
            setDistributors([]);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setLocation(userLocation);
                    findDistributors(userLocation);
                },
                (geoError) => {
                    setError("Habilite o GPS para encontrar lojas próximas.");
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, [isOpen]);

    const findDistributors = async (userLocation: { latitude: number; longitude: number }) => {
        const prompt = "Encontre filiais da Leo Madeiras, GMAD, Gasômetro Madeiras e revendas de MDF em um raio de 20km da minha localização. Retorne o nome, endereço, e se possível o telefone de contato de cada uma.";
        try {
            const { sources } = await generateGroundedResponse(prompt, userLocation);
            const foundDistributors = sources
                .filter(source => source.maps)
                .map(source => ({
                    title: source.maps.title,
                    uri: source.maps.uri,
                    // Heurística de WhatsApp baseada em telefone se houver na metadata futuramente
                }));
            
            if (foundDistributors.length === 0) {
                 setError("Nenhuma loja localizada nesta região.");
            } else {
                setDistributors(foundDistributors);
            }
        } catch (apiError) {
            setError("Falha na varredura geoespacial.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[500] flex justify-center items-center p-4 backdrop-blur-3xl animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#1a1a1a] rounded-[3.5rem] w-full max-w-2xl h-[85vh] shadow-3xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#111]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <StoreIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase italic tracking-tighter leading-none">Radar de Lojas</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.3em] mt-1.5">Fornecedores Iara Grounding</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto no-scrollbar bg-[#fdfaf5] dark:bg-[#0a0808]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <Spinner size="lg" />
                            <p className="text-[10px] font-black uppercase text-[#d4ac6e] tracking-[0.6em] animate-pulse italic">Varendo distribuidores locais...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-30">
                            <MapPin className="w-16 h-16 mb-4" />
                            <p className="text-sm font-black uppercase">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {distributors.map((dist, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl group hover:border-[#d4ac6e]/30 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-black text-[#3e3535] dark:text-white uppercase tracking-tighter leading-none">{dist.title}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <MapPin className="w-3 h-3 text-[#b99256]" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loja verificada via GPS</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#f0e9dc] dark:bg-black/20 p-3 rounded-2xl">
                                            <StoreIcon className="w-5 h-5 text-[#b99256]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <a 
                                            href={`https://wa.me/?text=${encodeURIComponent(`Olá, sou o mestre marceneiro e gostaria de cotar materiais com a unidade ${dist.title}`)}`}
                                            target="_blank"
                                            className="bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_8px_20px_rgba(37,211,102,0.3)] hover:scale-[1.02]"
                                        >
                                            <WhatsappIcon className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                                        </a>
                                        <a 
                                            href={dist.uri}
                                            target="_blank"
                                            className="bg-[#3e3535] text-[#d4ac6e] p-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Abrir Rota</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
                 <footer className="p-8 border-t border-gray-100 dark:border-white/5 bg-[#f5f1e8] dark:bg-[#111] text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.4em]">Resultados em tempo real via Google Maps Engine</p>
                </footer>
            </div>
        </div>
    );
};
