export type ConnectionType =
  | 'resonance'
  | 'tension'
  | 'genealogy'
  | 'metaphor'
  | 'bridge'
  | 'ghost';

export interface Fragment {
  id: string;
  text: string;
}

export interface Connection {
  type: ConnectionType;
  source: string;
  target: string;
  strength: number;
  description: string;
}

export interface Ghost {
  id: string;
  label: string;
  description: string;
  connected_to: string[];
}

export interface GraphData {
  connections: Connection[];
  ghosts: Ghost[];
}

export type AppMode = 'canvas' | 'loading' | 'graph';

export interface AppState {
  fragments: Fragment[];
  selectedIds: Set<string>;
  mode: AppMode;
  graphData: GraphData | null;
}

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  resonance: '#3B82F6',
  tension: '#EF4444',
  genealogy: '#22C55E',
  metaphor: '#A855F7',
  bridge: '#EAB308',
  ghost: '#6B7280',
};
