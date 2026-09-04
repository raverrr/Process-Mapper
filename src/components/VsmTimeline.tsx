import { getAbsolutePosition } from '../lib/geometry';
import { computeVsm, formatDuration, nodeHasVsm } from '../model/vsm';
import type { AppNode, ProcessNode } from '../types';

type Props = {
  nodes: AppNode[];
  hoursPerDay: number;
};

export function VsmTimeline({ nodes, hoursPerDay }: Props) {
  const processNodes = nodes.filter((n): n is ProcessNode => n.type === 'process' && nodeHasVsm(n));
  if (processNodes.length === 0) return null;

  const ordered = [...processNodes].sort((a, b) => {
    const ax = getAbsolutePosition(a, nodes).x;
    const bx = getAbsolutePosition(b, nodes).x;
    return ax - bx;
  });

  const stats = computeVsm(ordered, hoursPerDay);
  const max = Math.max(
    ...stats.steps.map((s) => Math.max(s.processTimeMinutes, s.waitMinutes, 1)),
    1,
  );

  return (
    <div className="vsm-timeline">
      <div className="vsm-timeline-head">
        <strong>Value stream</strong>
        <span>
          C&amp;A {stats.rolledCA == null ? '—' : `${stats.rolledCA.toFixed(1)}%`}
          <span className="dot">·</span>
          PCE {stats.pce == null ? '—' : `${stats.pce.toFixed(1)}%`}
        </span>
      </div>
      <div className="vsm-steps">
        {stats.steps.map((step) => (
          <div key={step.id} className="vsm-step">
            <div className="vsm-bars">
              <div
                className="vsm-bar pt"
                style={{ width: `${Math.max(12, (step.processTimeMinutes / max) * 88)}px` }}
                title={`Process time ${formatDuration(step.processTimeMinutes, hoursPerDay)}`}
              >
                {step.processTimeMinutes > 0 ? formatDuration(step.processTimeMinutes, hoursPerDay) : ''}
              </div>
              <div
                className="vsm-bar wait"
                style={{ width: `${Math.max(step.waitMinutes > 0 ? 12 : 0, (step.waitMinutes / max) * 88)}px` }}
                title={`Wait ${formatDuration(step.waitMinutes, hoursPerDay)}`}
              >
                {step.waitMinutes > 0 ? formatDuration(step.waitMinutes, hoursPerDay) : ''}
              </div>
            </div>
            <div className="vsm-step-label">{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
