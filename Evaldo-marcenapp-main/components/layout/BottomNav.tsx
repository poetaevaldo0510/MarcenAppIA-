
import React from 'react';
import { 
  LayoutDashboard, Zap, Truck, Users, UserCircle, Wrench, Globe
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface Props {
  activeModule: string;
  onNavigate: (module: any) => void;
}

export const BottomNav: React.FC<Props> = ({ activeModule, onNavigate }) => {
  const { isAdmin } = useProjectStore();

  const items = [
    { id: isAdmin ? 'ecosystem' : 'dashboard', label: isAdmin ? 'Ecossistema' : 'Início', icon: isAdmin ? Globe : LayoutDashboard },
    { id: 'crm', label: 'Clientes', icon: Users },
    { id: 'studio', label: 'YARA', icon: Zap, highlight: true },
    { id: 'marketplace', label: 'Loja IA', icon: ShoppingCartIcon },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 h-20 bg-[#202c33] border-t border-white/5 flex items-center justify-around px-2 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {items.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <div key={item.id} className="flex-1 flex flex-col items-center">
            <button
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 group relative transition-all ${item.highlight ? 'z-10 -mt-8' : ''}`}
            >
              <div className={`p-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? (item.highlight ? 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.5)] scale-110' : 'bg-white/5 text-indigo-400') 
                  : (item.highlight ? 'bg-indigo-600/30 text-indigo-400' : 'text-stone-500 hover:text-indigo-400')
              }`}>
                <item.icon size={item.highlight ? 28 : 22} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-400' : 'text-stone-600'}`}>
                {item.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
};

// Helper internal icon
const ShoppingCartIcon = ({size, strokeWidth}: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);
