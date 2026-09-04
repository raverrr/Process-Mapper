import type { PathKind, ProcessKind, SwimlaneColor } from './types';

export const KIND_META: Record<
  ProcessKind,
  { label: string; description: string; color: string; defaultName: string }
> = {
  'start-end': {
    label: 'Start / End',
    description: 'Beginning or end of a process.',
    color: '#2e7d32',
    defaultName: 'Start',
  },
  task: {
    label: 'Task',
    description: 'A step or activity in the process.',
    color: '#455a64',
    defaultName: 'Task',
  },
  decision: {
    label: 'Decision',
    description: 'A branch based on a condition.',
    color: '#9e8b00',
    defaultName: 'Decision?',
  },
  event: {
    label: 'Event',
    description: 'An intermediate wait, trigger, or message.',
    color: '#ad1457',
    defaultName: 'Event',
  },
  'input-output': {
    label: 'Input / Output',
    description: 'Data or material entering or leaving the process.',
    color: '#1565c0',
    defaultName: 'Input / Output',
  },
  document: {
    label: 'Document',
    description: 'A physical or digital document.',
    color: '#d84315',
    defaultName: 'Document',
  },
  database: {
    label: 'Database',
    description: 'A store of data.',
    color: '#546e7a',
    defaultName: 'Database',
  },
  preparation: {
    label: 'Preparation',
    description: 'A setup step before a task.',
    color: '#6a1b9a',
    defaultName: 'Prepare',
  },
};

export const KIND_SIZES: Record<ProcessKind, { w: number; h: number }> = {
  'start-end': { w: 172, h: 56 },
  task: { w: 180, h: 76 },
  decision: { w: 144, h: 144 },
  event: { w: 80, h: 80 },
  'input-output': { w: 184, h: 72 },
  document: { w: 164, h: 88 },
  database: { w: 154, h: 96 },
  preparation: { w: 160, h: 86 },
};

export const SWIMLANE_FILL: Record<SwimlaneColor, string> = {
  gray: 'rgba(80, 80, 90, 0.38)',
  blue: 'rgba(21, 101, 192, 0.32)',
  green: 'rgba(46, 125, 50, 0.32)',
  yellow: 'rgba(158, 139, 0, 0.28)',
  purple: 'rgba(106, 27, 154, 0.32)',
  red: 'rgba(183, 28, 28, 0.28)',
};

export const SWIMLANE_ACCENT: Record<SwimlaneColor, string> = {
  gray: '#9e9ea8',
  blue: '#64b5f6',
  green: '#81c784',
  yellow: '#fbc02d',
  purple: '#ce93d8',
  red: '#ef9a9a',
};

export const PATH_LABELS: Record<PathKind, string> = {
  smoothstep: 'Smooth',
  bezier: 'Curve',
  straight: 'Straight',
  step: 'Step',
};

export const DEFAULT_HOURS_PER_DAY = 8;
export const STORAGE_KEY = 'process-mapper.current';
export const UI_STORAGE_KEY = 'process-mapper.ui';
export const SWIMLANE_WIDTH = 1600;
export const SWIMLANE_HEIGHT = 220;
export const SWIMLANE_LABEL_WIDTH = 48;
export const HISTORY_LIMIT = 60;
