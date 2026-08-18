import { useEffect, useRef } from 'react';
import { playScannerBeep } from '../utils/sound';

export function useBarcodeScanner(onScan) {
  const bufferRef = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Physical USB / Bluetooth barcode scanners type very rapidly and finish with Enter
      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length >= 3) {
          const barcode = bufferRef.current.trim();
          playScannerBeep();
          if (onScan) {
            onScan(barcode);
          }
          bufferRef.current = '';
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
      }

      // Record printable alphanumeric characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;

        // Reset buffer if delay between keypresses is > 150ms (manual human typing)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}
