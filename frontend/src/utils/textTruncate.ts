/**
 * Truncate text to first N words
 * @param text - The text to truncate
 * @param maxWords - Maximum number of words to keep (default: 3)
 * @returns Truncated text with "..." suffix if truncated
 */
export const truncateWords = (text: string | null | undefined, maxWords: number = 3): string => {
  if (!text) return '';
  
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  return words.slice(0, maxWords).join(' ') + '...';
};

