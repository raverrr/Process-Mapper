import { useEffect, useState } from 'react';
import { UI_STORAGE_KEY } from '../constants';

type Prefs = {
  palette: boolean;
  inspector: boolean;
  equalSwimlaneWidths: boolean;
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return { palette: true, inspector: true, equalSwimlaneWidths: false };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      palette: parsed.palette !== false,
      inspector: parsed.inspector !== false,
      equalSwimlaneWidths: parsed.equalSwimlaneWidths === true,
    };
  } catch {
    return { palette: true, inspector: true, equalSwimlaneWidths: false };
  }
}

export function useUiPrefs() {
  const [paletteOpen, setPaletteOpen] = useState(() => readPrefs().palette);
  const [inspectorOpen, setInspectorOpen] = useState(() => readPrefs().inspector);
  const [equalSwimlaneWidths, setEqualSwimlaneWidths] = useState(() => readPrefs().equalSwimlaneWidths);

  useEffect(() => {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({
        palette: paletteOpen,
        inspector: inspectorOpen,
        equalSwimlaneWidths,
      }),
    );
  }, [equalSwimlaneWidths, inspectorOpen, paletteOpen]);

  return {
    paletteOpen,
    setPaletteOpen,
    inspectorOpen,
    setInspectorOpen,
    equalSwimlaneWidths,
    setEqualSwimlaneWidths,
  };
}
