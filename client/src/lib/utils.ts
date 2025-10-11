import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(title: string, displayId: string): string {
  if (!title || !displayId) {
    console.error('createSlug: title or displayId is missing', { title, displayId });
    return 'invalid-auction';
  }
  
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9а-я\s-]/g, '') // Remove special characters, keep Cyrillic
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 35); // Limit length to 35 chars
  // Add displayId for uniqueness (e.g., QB-7029)
  const cleanDisplayId = displayId.replace(/[\/\\]/g, '-').toLowerCase();
  return `${baseSlug}-${cleanDisplayId}`;
}

export function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
