import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Ban,
  HeartPulse,
  Users,
  Shield,
  Star,
  Award,
  Target,
  Zap,
  CheckCircle2,
  Timer,
  DollarSign,
  FileWarning,
  ShieldAlert,
  Flame,
  XCircle,
  ThumbsDown,
  Scale,
  Building2,
  Briefcase,
  type LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'alert-triangle': AlertTriangle,
  'alerttriangle': AlertTriangle,
  clock: Clock,
  'trending-down': TrendingDown,
  'trendingdown': TrendingDown,
  ban: Ban,
  'heart-pulse': HeartPulse,
  'heartpulse': HeartPulse,
  users: Users,
  'users-x': Users,
  shield: Shield,
  'shield-alert': ShieldAlert,
  star: Star,
  award: Award,
  target: Target,
  zap: Zap,
  'check-circle': CheckCircle2,
  'check-circle-2': CheckCircle2,
  timer: Timer,
  'dollar-sign': DollarSign,
  'file-warning': FileWarning,
  flame: Flame,
  'x-circle': XCircle,
  'thumbs-down': ThumbsDown,
  scale: Scale,
  building: Building2,
  'building-2': Building2,
  briefcase: Briefcase,
};

export function getIconComponent(name: string): React.ElementType {
  const normalized = name.toLowerCase().trim();
  return iconMap[normalized] || AlertTriangle;
}

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = getIconComponent(name);
  return <Icon {...props} />;
}
