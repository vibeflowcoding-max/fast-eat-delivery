import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statsCardVariants = cva(
    'rounded-[16px] p-6 transition-all hover:shadow-md',
    {
        variants: {
            variant: {
                default: 'bg-white border border-brand-accent',
                primary: 'bg-brand-primary text-white',
                success: 'bg-green-50 border border-green-200',
                warning: 'bg-orange-50 border border-orange-200',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface StatsCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    variant,
    className,
    ...props
}: StatsCardProps) {
    return (
        <div className={cn(statsCardVariants({ variant }), className)} {...props}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
                    <p className="text-3xl font-bold font-heading">{value}</p>
                    {subtitle && (
                        <p className="text-sm opacity-60 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs opacity-60">vs mes anterior</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="ml-4 p-3 rounded-[12px] bg-brand-accent">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
