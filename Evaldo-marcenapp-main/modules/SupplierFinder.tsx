
import React, { useState, useEffect } from 'react';
import { MapPin, Search, ExternalLink, Loader2, Navigation, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, Button, InputGroup } from '../components/UI';
import { findNearbySuppliers } from '../geminiService';

export const SupplierFinder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{text: string, links: any[] | undefined} | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        },
        (err) => {
          let msg = "Erro desconhecido ao obter localização.";
          if (err.code === 1) msg = "Acesso à localização negado pelo usuário ou pelo navegador.";
          else if (err.code === 2) msg = "Posição de localização indisponível.";
          else if (err.code === 3) msg = "Tempo esgotado ao obter localização.";
          
          setLocationError(msg);
          console.error("Geolocation error:", err);
        },
        { timeout: 10000 }
      );
    } else {
      setLocationError("Seu navegador não suporta geolocalização.");
    }
  };

  const handleSearch = async () => {
    if (!location) {
      requestLocation();
      return;
    }
    setLoading(true);
    try {
      const data = await findNearbySuppliers(location.lat, location.lng);
      setResults(data);
    } catch (err) {
      alert("Erro ao buscar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <Card className="p-8 mb-8 text-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MapPin className="text-indigo-400" size={32}/>
        </div>
        <h1 className="text-2xl font-bold mb-2">Encontrar Fornecedores</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">Utilize nossa IA com Google Maps integrado para encontrar as melhores lojas de MDF e ferragens perto de você.</p>
        
        {locationError ? (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-red-400 mb-3 justify-center">
              <AlertTriangle size={18}/>
              <span className="text-[10px] font-black uppercase tracking-widest">{String(locationError)}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={requestLocation} 
              icon={RefreshCw}
              className="mx-auto h-12 text-[9px] border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <Button 
            variant="magic" 
            onClick={handleSearch} 
            disabled={loading || !location} 
            icon={Search}
            className="mx-auto px-8"
          >
            {loading ? <Loader2 className="animate-spin"/> : 'Buscar agora'}
          </Button>
        )}

        {!location && !locationError && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <Loader2 className="animate-spin text-amber-400" size={16}/>
            <p className="text-[9px] text-amber-400 font-black uppercase tracking-[0.2em] animate-pulse">Obtendo sua localização...</p>
          </div>
        )}
      </Card>

      {results && (
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-xl">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Star className="text-amber-500" size={18}/> Recomendações da IA</h2>
             <div className="prose prose-slate text-sm leading-relaxed text-slate-700 mb-8 whitespace-pre-wrap">
               {typeof results.text === 'string' ? results.text : JSON.stringify(results.text)}
             </div>

             {results.links && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
                 {results.links.map((chunk: any, i: number) => (
                   chunk.maps && (
                     <a 
                       key={i} 
                       href={chunk.maps.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl hover:border-indigo-500 hover:bg-white transition-all group"
                     >
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Navigation size={18}/>
                         </div>
                         <span className="font-bold text-slate-800 text-sm">
                           {typeof chunk.maps.title === 'string' ? chunk.maps.title : "Ver no Maps"}
                         </span>
                       </div>
                       <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-600"/>
                     </a>
                   )
                 ))}
               </div>
             )}
          </Card>
        </div>
      )}
    </div>
  );
};
