import { useEffect, useState } from 'react';
import { UI_STORAGE_KEY } from '../constants';

type Prefs = {
  palette: boolean;
  inspector: boolean;
  equalSwimlaneWidths: boolean;
  pngIncludeDetails: boolean;
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) {
      return { palette: true, inspector: true, equalSwimlaneWidths: false, pngIncludeDetails: false };
    }
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      palette: parsed.palette !== false,
      inspector: parsed.inspector !== false,
      equalSwimlaneWidths: parsed.equalSwimlaneWidths === true,
      pngIncludeDetails: parsed.pngIncludeDetails === true,
    };
  } catch {
    return { palette: true, inspector: true, equalSwimlaneWidths: false, pngIncludeDetails: false };
  }
}

export function useUiPrefs() {
  const [paletteOpen, setPaletteOpen] = useState(() => readPrefs().palette);
  const [inspectorOpen, setInspectorOpen] = useState(() => readPrefs().inspector);
  const [equalSwimlaneWidths, setEqualSwimlaneWidths] = useState(() => readPrefs().equalSwimlaneWidths);
  const [pngIncludeDetails, setPngIncludeDetails] = useState(() => readPrefs().pngIncludeDetails);

  useEffect(() => {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({
        palette: paletteOpen,
        inspector: inspectorOpen,
        equalSwimlaneWidths,
        pngIncludeDetails,
      }),
    );
  }, [equalSwimlaneWidths, inspectorOpen, paletteOpen, pngIncludeDetails]);

  return {
    paletteOpen,
    setPaletteOpen,
    inspectorOpen,
    setInspectorOpen,
    equalSwimlaneWidths,
    setEqualSwimlaneWidths,
    pngIncludeDetails,
    setPngIncludeDetails,
  };
}
