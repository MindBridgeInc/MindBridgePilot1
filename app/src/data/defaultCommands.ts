import type { CommandId } from '../core/types';

export interface CommandDefinition {
  id: CommandId;
  label: string;
  description: string;
}

export const DEFAULT_COMMANDS: CommandDefinition[] = [
  {
    id: 'open_hand',
    label: 'Open Hand',
    description: 'Extend fingers outward — index and middle sensors rise.',
  },
  {
    id: 'close_hand',
    label: 'Close Hand',
    description: 'Make a fist — all sensors rise evenly.',
  },
  {
    id: 'pinch',
    label: 'Pinch',
    description: 'Thumb and index pressure — sensors 0 and 2 activate.',
  },
  {
    id: 'rest',
    label: 'Rest',
    description: 'Neutral relaxed state — minimal activation.',
  },
];

export const COMMAND_LABELS: Record<CommandId, string> = Object.fromEntries(
  DEFAULT_COMMANDS.map((c) => [c.id, c.label])
) as Record<CommandId, string>;

export function buildDefaultTemplates(): import('../core/types').CommandTemplate[] {
  return [
    {
      id: 'open_hand',
      label: 'Open Hand',
      description: 'Extend fingers outward',
      samples: [
        [0.08, 0.35, 0.42, 0.38, 0.12, 0.08],
        [0.07, 0.33, 0.4, 0.36, 0.11, 0.07],
      ],
      featureVector: [],
    },
    {
      id: 'close_hand',
      label: 'Close Hand',
      description: 'Make a fist',
      samples: [
        [0.45, 0.48, 0.52, 0.5, 0.44, 0.42],
        [0.43, 0.46, 0.5, 0.48, 0.42, 0.4],
      ],
      featureVector: [],
    },
    {
      id: 'pinch',
      label: 'Pinch',
      description: 'Thumb and index',
      samples: [
        [0.55, 0.1, 0.52, 0.08, 0.12, 0.1],
        [0.52, 0.09, 0.5, 0.07, 0.11, 0.09],
      ],
      featureVector: [],
    },
    {
      id: 'rest',
      label: 'Rest',
      description: 'Neutral relaxed',
      samples: [
        [0.05, 0.06, 0.05, 0.06, 0.05, 0.05],
        [0.06, 0.05, 0.06, 0.05, 0.06, 0.05],
      ],
      featureVector: [],
    },
  ];
}
