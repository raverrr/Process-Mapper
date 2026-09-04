import type { AppNode, ProcessNode } from '../types';

export type VsmStep = {
  id: string;
  label: string;
  leadTimeMinutes: number;
  processTimeMinutes: number;
  waitMinutes: number;
  percentCA?: number;
};

export type VsmStats = {
  steps: VsmStep[];
  sumLeadMinutes: number;
  sumProcessMinutes: number;
  rolledCA: number | null;
  pce: number | null;
};

function isProcess(node: AppNode): node is ProcessNode {
  return node.type === 'process';
}

export function nodeHasVsm(node: ProcessNode): boolean {
  return (
    node.data.leadTimeDays != null ||
    node.data.processTimeMinutes != null ||
    node.data.percentCA != null
  );
}

export function computeVsm(nodes: AppNode[], hoursPerDay: number): VsmStats {
  const dayMinutes = Math.max(hoursPerDay, 0.01) * 60;
  const steps: VsmStep[] = nodes
    .filter(isProcess)
    .filter(nodeHasVsm)
    .map((node) => {
      const leadTimeMinutes = (node.data.leadTimeDays ?? 0) * dayMinutes;
      const processTimeMinutes = node.data.processTimeMinutes ?? 0;
      return {
        id: node.id,
        label: node.data.label,
        leadTimeMinutes,
        processTimeMinutes,
        waitMinutes: Math.max(0, leadTimeMinutes - processTimeMinutes),
        percentCA: node.data.percentCA,
      };
    });

  const sumLeadMinutes = steps.reduce((sum, step) => sum + step.leadTimeMinutes, 0);
  const sumProcessMinutes = steps.reduce((sum, step) => sum + step.processTimeMinutes, 0);

  const caSteps = steps.filter((step) => step.percentCA != null);
  const rolledCA =
    caSteps.length === 0
      ? null
      : caSteps.reduce((product, step) => product * ((step.percentCA ?? 100) / 100), 1) * 100;

  const pce = sumLeadMinutes > 0 ? (sumProcessMinutes / sumLeadMinutes) * 100 : null;

  return { steps, sumLeadMinutes, sumProcessMinutes, rolledCA, pce };
}

export function formatDuration(minutes: number, hoursPerDay: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0';
  const dayMin = Math.max(hoursPerDay, 0.01) * 60;
  if (minutes >= dayMin) {
    return `${trimNumber(minutes / dayMin)}d`;
  }
  if (minutes >= 60) {
    return `${trimNumber(minutes / 60)}h`;
  }
  return `${trimNumber(minutes)}m`;
}

export function trimNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}
