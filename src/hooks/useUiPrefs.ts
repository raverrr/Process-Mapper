import { useEffect, useState } from 'react';
import { UI_STORAGE_KEY } from '../constants';

type Prefs = {
  palette: boolean;
  inspector: boolean;
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return { palette: true, inspector: true };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      palette: parsed.palette !== false,
      inspector: parsed.inspector !== false,
    };
  } catch {
    return { palette: true, inspector: true };
  }
}

export function useUiPrefs() {
  const [paletteOpen, setPaletteOpen] = useState(() => readPrefs().palette);
  const [inspectorOpen, setInspectorOpen] = useState(() => readPrefs().inspector);

  useEffect(() => {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({ palette: paletteOpen, inspector: inspectorOpen }),
    );
  }, [inspectorOpen, paletteOpen]);

  return { paletteOpen, setPaletteOpen, inspectorOpen, setInspectorOpen };
}
