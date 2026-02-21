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
  image?: {
    base64: string;      // base64-encoded image data (no prefix)
    mimeType: string;    // e.g. 'image/jpeg', 'image/png'
    thumbnail: string;   // data URL for display: `data:${mimeType};base64,${base64}`
    reading?: {
      surface: string;
      mood: string;
      metaphor: string;
      fragment: string;
    };
  };
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
  field_reading?: string;
  emergent_theme?: string;
}

export const THEME_PALETTE = [
  '#F472B6',
  '#38BDF8',
  '#FB923C',
  '#4ADE80',
  '#C084FC',
  '#FACC15',
  '#2DD4BF',
  '#F87171',
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
