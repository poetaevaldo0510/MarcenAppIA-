
import React, { useState } from 'react';
import { 
  User, MapPin, Phone, Save, Award, Building2, 
  Coins, Plus, Smartphone, Download, Briefcase, FileText, LogOut, CheckCircle2
} from 'lucide-react';
import { Card, Button, InputGroup, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';

export const Settings: React.FC = () => {
  const { 
    credits, workshopProfile, updateWorkshopProfile, logout 
  } = useProjectStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulação de salvamento industrial
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <Badge variant="info">Configurações Industriais</Badge>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mt-4 leading-none">Perfil.<span className="text-indigo-400">Oficina</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-3 ml-1">Gerencie sua identidade no ecossistema MarcenaPP.</p>
        </div>
        
        <div className="flex bg-[#1c272d] p-6 rounded-[2.5rem] border border-white/5 items-center gap-8 shadow-2xl">
           <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
              <Coins size={32}/>
           </div>
           <div>
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none">Saldo de Tokens</p>
              <p className="text-3xl font-black text-amber-50 italic leading-none mt-3">{credits} <span className="text-[10px] not-italic opacity-40 uppercase ml-1">CR</span></p>
           </div>
           <Button variant="magic" className="h-14 px-8 rounded-2xl text-[10px]" icon={Plus}>Comprar</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           <Card className="p-10 border-white/5 bg-[#141210] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5"><Building2 size={120}/></div>
              <h3 className="text-xl font-black italic uppercase text-white mb-10 flex items-center gap-4">
                 <Briefcase size={22} className="text-indigo-400" /> Registro da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <InputGroup 
                    label="Nome Comercial / Oficina" 
                    value={workshopProfile.name} 
                    onChange={(v:string) => updateWorkshopProfile({ name: v })}
                    placeholder="Ex: Marcenaria de Elite"
                 />
                 <InputGroup 
                    label="WhatsApp p/ Clientes" 
                    placeholder="55 (11) 99999-9999"
                    value={workshopProfile.whatsapp} 
                    onChange={(v:string) => updateWorkshopProfile({ whatsapp: v })}
                    icon={Phone}
                 />
                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                       <Badge variant="neutral">Opcional</Badge>
                    </div>
                    <InputGroup 
                        label="CPF ou CNPJ" 
                        placeholder="Deixe vazio se não possuir"
                        value={workshopProfile.document} 
                        onChange={(v:string) => updateWorkshopProfile({ document: v })}
                    />
                    <InputGroup 
                        label="Endereço Fiscal / Base" 
                        placeholder="Cidade, UF ou Endereço"
                        value={workshopProfile.address} 
                        onChange={(v:string) => updateWorkshopProfile({ address: v })}
                        icon={MapPin}
                    />
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                 <Button 
                    variant={saveSuccess ? "magic" : "primary"} 
                    icon={saveSuccess ? CheckCircle2 : Save} 
                    onClick={handleSave} 
                    className="flex-1 h-16 rounded-2xl transition-all"
                    disabled={isSaving}
                 >
                    {isSaving ? "Sincronizando..." : saveSuccess ? "Dados Salvos!" : "Salvar Registro"}
                 </Button>
                 <Button variant="danger" icon={LogOut} onClick={logout} className="px-10 h-16 rounded-2xl">Sair da Conta</Button>
              </div>
           </Card>

           <Card className="p-8 border-indigo-500/20 bg-indigo-600/5">
              <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4 flex items-center gap-3"><Award size={20} className="text-indigo-400" /> Nível Mestre Validador</h4>
              <p className="text-[11px] text-stone-400 font-bold uppercase leading-relaxed italic">"Suas ferramentas de projeto e orçamento estão liberadas para uso independente de registro fiscal completo."</p>
           </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-3xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
              <Smartphone className="mb-8 opacity-50" size={40}/>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-tight">Painel Mobile</h3>
              <p className="text-[11px] font-bold opacity-80 uppercase leading-relaxed mb-10">Instale o MarcenaPP na tela inicial do seu celular para acesso instantâneo na obra.</p>
              <Button variant="dark" className="w-full bg-black/40 border-none text-white font-black h-14 rounded-2xl text-[10px]" icon={Download}>Baixar WebApp</Button>
           </Card>
        </div>
      </div>
    </div>
  );
};
