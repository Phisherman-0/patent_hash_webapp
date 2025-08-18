import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue === 0) return '$0';
  
  if (numValue >= 1000000) {
    return `$${(numValue / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    return `$${numValue.toLocaleString()}`;
  }
}
