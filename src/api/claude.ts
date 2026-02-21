import type { Fragment, GraphData } from '../types';

export async function analyzeFragments(fragments: Fragment[]): Promise<GraphData> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragments }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Analysis failed: ${response.status}`);
  }

  const data: GraphData = await response.json();
  return data;
}
