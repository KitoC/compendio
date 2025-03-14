
/**
 * Generates a URL-friendly alias from a title string
 * 
 * @param title The title to convert to an alias
 * @returns A URL-friendly alias string
 */
export const generateAlias = (title: string): string => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Remove consecutive hyphens
};

/**
 * Checks if a string is a valid UUID
 * 
 * @param str The string to check
 * @returns True if the string is a valid UUID
 */
export const isUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
