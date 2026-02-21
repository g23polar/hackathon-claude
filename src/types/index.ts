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

export interface FragmentSummary {
  id: string;
  summary: string;
}

export interface Theme {
  name: string;
  color: string;
  fragment_ids: string[];
}

export interface GraphData {
  connections: Connection[];
  ghosts: Ghost[];
  summaries: FragmentSummary[];
  themes: Theme[];
}

export const THEME_PALETTE = [
  '#F472B6', // pink
  '#38BDF8', // sky
  '#FB923C', // orange
  '#4ADE80', // green
  '#C084FC', // violet
  '#FACC15', // yellow
  '#2DD4BF', // teal
  '#F87171', // red
];

export interface ThematicCluster {
  id: string;
  name: string;
  description: string;
  fragment_ids: string[];
  color: string;
}

export interface NarrativeThread {
  id: string;
  name: string;
  description: string;
  sequence: string[];
}

export interface SecondaryAnalysis {
  clusters: ThematicCluster[];
  threads: NarrativeThread[];
  synthesis: string;
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
