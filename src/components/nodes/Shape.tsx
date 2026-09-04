import { KIND_META } from '../../constants';
import type { ProcessKind } from '../../types';

type Props = {
  kind: ProcessKind;
  width: number;
  height: number;
  selected: boolean;
};

export function Shape({ kind, width, height, selected }: Props) {
  const fill = KIND_META[kind].color;
  const stroke = selected ? '#e6d6ff' : 'rgba(255,255,255,0.18)';
  const sw = selected ? 2.4 : 1.2;
  const common = { fill, stroke, strokeWidth: sw };

  switch (kind) {
    case 'start-end':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect x={1.5} y={1.5} width={width - 3} height={height - 3} rx={(height - 3) / 2} {...common} />
        </svg>
      );
    case 'task':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect x={1.5} y={1.5} width={width - 3} height={height - 3} rx={10} {...common} />
        </svg>
      );
    case 'decision':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <polygon
            points={`${width / 2},3 ${width - 3},${height / 2} ${width / 2},${height - 3} 3,${height / 2}`}
            {...common}
          />
        </svg>
      );
    case 'event':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 3} ry={height / 2 - 3} {...common} />
        </svg>
      );
    case 'input-output':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <polygon
            points={`${22},2 ${width - 2},2 ${width - 22},${height - 2} 2,${height - 2}`}
            {...common}
          />
        </svg>
      );
    case 'document': {
      const fold = 16;
      const waveY = height - 12;
      const d = [
        `M 2 2`,
        `H ${width - fold - 2}`,
        `L ${width - 2} ${fold}`,
        `V ${waveY}`,
        `Q ${width * 0.75} ${waveY + 10} ${width / 2} ${waveY}`,
        `Q ${width * 0.25} ${waveY - 10} 2 ${waveY}`,
        `Z`,
      ].join(' ');
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <path d={d} {...common} />
          <polyline
            points={`${width - fold - 2},2 ${width - fold - 2},${fold} ${width - 2},${fold}`}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    }
    case 'database': {
      const rx = width / 2 - 4;
      const cyTop = 16;
      const cyBot = height - 16;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <path
            d={`M 4 ${cyTop} V ${cyBot} A ${rx} 12 0 0 0 ${width - 4} ${cyBot} V ${cyTop} A ${rx} 12 0 0 1 4 ${cyTop}`}
            {...common}
          />
          <ellipse cx={width / 2} cy={cyTop} rx={rx} ry={12} {...common} />
        </svg>
      );
    }
    case 'preparation': {
      const inset = width * 0.22;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <polygon
            points={`${inset},2 ${width - inset},2 ${width - 3},${height / 2} ${width - inset},${height - 2} ${inset},${height - 2} 3,${height / 2}`}
            {...common}
          />
        </svg>
      );
    }
    default:
      return null;
  }
}
