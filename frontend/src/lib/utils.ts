import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONFIG } from '../config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fix image URLs to use the correct base URL
 * Converts URLs like "http://localhost:8000/uploads/..." to "http://localhost/form.fr/uploads/..."
 */
export function fixImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's already a full URL with the correct base, return as is
  if (url.startsWith(CONFIG.BASE_URL)) {
    return url;
  }
  
  // If it's a full URL with wrong base, fix it
  if (url.startsWith('http://localhost:8000')) {
    return url.replace('http://localhost:8000', CONFIG.BASE_URL);
  }
  
  // If it's a relative path, make it absolute
  if (url.startsWith('/uploads/')) {
    return `${CONFIG.BASE_URL}${url}`;
  }
  
  // If it's just a filename, assume it's in uploads
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `${CONFIG.BASE_URL}/uploads/${url}`;
  }
  
  return url;
}
