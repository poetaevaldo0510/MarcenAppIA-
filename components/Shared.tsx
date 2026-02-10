
import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 80V20H50L90 60V80H50L10 40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <path d="M50 20V80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <rect x="45" y="45" width="10" height="10" fill="currentColor" rx="2" />
    </svg>
);

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
    return <div className={`${s} border-4 border-[#00a884]/20 border-t-[#00a884] rounded-full animate-spin`}></div>;
};

export { 
  Plus as PlusIcon, 
  Trash2 as TrashIcon, 
  Search as SearchIcon, 
  Mic as MicIcon, 
  Camera as CameraIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Globe as GlobeIcon,
  Layout as BlueprintIcon,
  DollarSign as CurrencyDollarIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
  Wrench as ToolsIcon,
  Flame as FlameIcon,
  Scissors as SawIcon,
  Ruler as RulerIcon,
  ChevronRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  LogOut as LogoutIcon,
  Ticket as TicketIcon,
  User as UserIcon,
  ShoppingCart as StoreIcon,
  Maximize2 as ArrowsExpandIcon,
  RotateCw as RefreshCcw,
  RefreshCw,
  Box as CubeIcon,
  Sun as SunIcon,
  Share2 as ShareIcon,
  FileText as DocumentTextIcon,
  TrendingUp as TrendingUpIcon,
  Briefcase as DossierIcon,
  Settings as CogIcon,
  Cloud,
  Layers as GridIcon,
  Smartphone as ARIcon,
  Undo as UndoIcon,
  Edit3 as PencilIcon,
  Paperclip as PaperClipIcon,
  Phone as PhoneIcon,
  Monitor as Video,
  CheckCircle2 as CheckCircle,
  // Fixed missing icon exports
  X,
  Lock as LockIcon,
  MessageCircle as WhatsappIcon,
  Book as BookIcon,
  MapPin,
  Wand2 as WandIcon,
  Mail as EmailIcon,
  Copy as CopyIcon,
  Rotate3d as Rotate3DIcon,
  Scale as ScaleIcon,
  Printer as PrinterIcon,
  AlertTriangle as AlertTriangleIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Minus as MinusIcon,
  ChefHat as KitchenIcon,
  Sofa as LivingRoomIcon,
  Bed as BedroomIcon,
  Bath as BathroomIcon,
  DoorOpen as ClosetIcon,
  Briefcase as OfficeIcon,
  Wind as BalconyIcon,
  Package as PantryIcon,
  Wine as WineCellarIcon,
  Users as UsersIcon
} from 'lucide-react';
