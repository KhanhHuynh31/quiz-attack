import { useState, useCallback } from 'react';

export const useClipboard = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  return { copied, copyToClipboard };
};