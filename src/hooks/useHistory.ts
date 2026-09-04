import { useCallback, useRef, useState } from 'react';
import { HISTORY_LIMIT } from '../constants';
import type { AppEdge, AppNode } from '../types';

export type Snapshot = {
  nodes: AppNode[];
  edges: AppEdge[];
  title: string;
  hoursPerDay: number;
};

function cloneSnap(snap: Snapshot): Snapshot {
  return structuredClone(snap);
}

function same(a: Snapshot | undefined, b: Snapshot): boolean {
  if (!a) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useHistory() {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [stamp, setStamp] = useState(0);

  const takeSnapshot = useCallback((snap: Snapshot) => {
    if (same(past.current[past.current.length - 1], snap)) return;
    past.current.push(cloneSnap(snap));
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    setStamp((n) => n + 1);
  }, []);

  const undo = useCallback((current: Snapshot): Snapshot | null => {
    const previous = past.current.pop();
    if (!previous) return null;
    future.current.push(cloneSnap(current));
    setStamp((n) => n + 1);
    return previous;
  }, []);

  const redo = useCallback((current: Snapshot): Snapshot | null => {
    const next = future.current.pop();
    if (!next) return null;
    past.current.push(cloneSnap(current));
    setStamp((n) => n + 1);
    return next;
  }, []);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    setStamp((n) => n + 1);
  }, []);

  return {
    takeSnapshot,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    stamp,
  };
}
