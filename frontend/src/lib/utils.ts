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
  
  // Replace escaped backslashes with forward slashes first
  let cleanedUrl = url.replace(/\\/g, '/');
  
  // If it's already a full URL with the correct base, return as is
  if (cleanedUrl.startsWith(CONFIG.BASE_URL)) {
    return cleanedUrl;
  }
  
  // If it's already a full URL with http://localhost:8000, keep it as is (backend server)
  if (cleanedUrl.startsWith('http://localhost:8000') || cleanedUrl.startsWith('https://localhost:8000')) {
    return cleanedUrl;
  }
  
  // Handle URLs that start with ":8000" (missing localhost and protocol)
  // Example: ":8000/uploads/..." -> "http://localhost:8000/uploads/..."
  if (cleanedUrl.startsWith(':8000')) {
    return `http://localhost${cleanedUrl}`;
  }
  
  // Handle URLs that start with "localhost:8000" without protocol (from API response)
  // Example: "localhost:8000\/uploads\/..." or "localhost:8000/uploads/..."
  // These URLs should remain as localhost:8000 (backend server), just add protocol if missing
  if (cleanedUrl.includes('localhost:8000')) {
    // Add http:// if missing
    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      return `http://${cleanedUrl}`;
    }
    return cleanedUrl;
  }
  
  // Handle URLs that start with "localhost" (without port) without protocol
  // Example: "localhost\/uploads\/..." or "localhost/uploads/..."
  if (cleanedUrl.includes('localhost') && !cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
    // Check if it starts with "localhost" (with or without /)
    if (cleanedUrl.startsWith('localhost/') || cleanedUrl.startsWith('localhost')) {
      // Add http:// protocol
      return `http://${cleanedUrl}`;
    }
  }
  
  // If it's a relative path starting with /uploads or /storage, make it absolute
  if (cleanedUrl.startsWith('/uploads/') || cleanedUrl.startsWith('/storage/')) {
    return `${CONFIG.BASE_URL}${cleanedUrl}`;
  }
  
  // If it's a relative path without leading slash (uploads/... or storage/...)
  if (cleanedUrl.startsWith('uploads/') || cleanedUrl.startsWith('storage/') || cleanedUrl.startsWith('organization/')) {
    return `${CONFIG.BASE_URL}/${cleanedUrl}`;
  }
  
  // If it's just a filename, assume it's in uploads
  if (!cleanedUrl.startsWith('http') && !cleanedUrl.startsWith('/')) {
    return `${CONFIG.BASE_URL}/uploads/${cleanedUrl}`;
  }
  
  return cleanedUrl;
}
