
/**
 * Copy text to clipboard using the Clipboard API
 * 
 * @param text The text to copy to clipboard
 * @returns A promise that resolves when the text is copied
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback: Failed to copy to clipboard:', err);
      document.body.removeChild(textArea);
      return false;
    }
  }
};
