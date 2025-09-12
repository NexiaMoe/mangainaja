import { useEffect } from 'react';

interface KeyboardControlsOptions {
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleControls: () => void;
  onToggleSettings: () => void;
  onExit: () => void;
}

export function useKeyboardControls({
  onNextPage,
  onPrevPage,
  onToggleControls,
  onToggleSettings,
  onExit,
}: KeyboardControlsOptions) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      // Prevent default behavior for reader keys
      if (['ArrowLeft', 'ArrowRight', 'a', 's', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'd':
          onNextPage();
          break;
        case 'ArrowLeft':
        case 'a':
          onPrevPage();
          break;
        case ' ':
          onToggleControls();
          break;
        case 's':
          onToggleSettings();
          break;
        case 'Escape':
          onExit();
          break;
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onNextPage, onPrevPage, onToggleControls, onToggleSettings, onExit]);
}