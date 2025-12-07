import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONFIG } from '../config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fix image URLs to use the correct base URL
 * Converts Laravel storage URLs to use the API server (http://localhost:8000)
 */
export function fixImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Replace escaped backslashes with forward slashes first
  let cleanedUrl = url.replace(/\\/g, '/');

  // Fix Laravel storage URLs that incorrectly use http://localhost instead of http://localhost:8000
  // Example: "http://localhost/storage/news/xxx.png" -> "http://localhost:8000/storage/news/xxx.png"
  if (cleanedUrl.startsWith('http://localhost/storage/') || cleanedUrl.startsWith('https://localhost/storage/')) {
    return cleanedUrl.replace('http://localhost/', `${API_URL}/`).replace('https://localhost/', `${API_URL}/`);
  }

  // If it's already a full URL with the API server (http://localhost:8000), keep it as is
  if (cleanedUrl.startsWith('http://localhost:8000') || cleanedUrl.startsWith('https://localhost:8000')) {
    return cleanedUrl;
  }

  // If it's already a full URL with the correct base, return as is
  if (cleanedUrl.startsWith(CONFIG.BASE_URL)) {
    return cleanedUrl;
  }

  // Handle URLs that start with ":8000" (missing localhost and protocol)
  // Example: ":8000/uploads/..." -> "http://localhost:8000/uploads/..."
  if (cleanedUrl.startsWith(':8000')) {
    return `http://localhost${cleanedUrl}`;
  }

  // Handle URLs that start with "localhost:8000" without protocol (from API response)
  // Example: "localhost:8000\/uploads\/..." or "localhost:8000/uploads/..."
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
      // Add http:// protocol and use API URL
      return `${API_URL}/${cleanedUrl.replace('localhost/', '')}`;
    }
  }

  // If it's a relative path starting with /uploads or /storage, use the API server
  if (cleanedUrl.startsWith('/uploads/') || cleanedUrl.startsWith('/storage/')) {
    return `${API_URL}${cleanedUrl}`;
  }

  // If it's a relative path without leading slash (uploads/... or storage/...)
  if (cleanedUrl.startsWith('uploads/') || cleanedUrl.startsWith('storage/')) {
    return `${API_URL}/${cleanedUrl}`;
  }

  // If it's an organization path, use CONFIG.BASE_URL
  if (cleanedUrl.startsWith('organization/')) {
    return `${CONFIG.BASE_URL}/${cleanedUrl}`;
  }

  // If it's just a filename, assume it's in uploads on the API server
  if (!cleanedUrl.startsWith('http') && !cleanedUrl.startsWith('/')) {
    return `${API_URL}/uploads/${cleanedUrl}`;
  }

  return cleanedUrl;
}
