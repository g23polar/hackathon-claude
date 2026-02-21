import type { Fragment, GraphData, SecondaryAnalysis } from '../types';

export async function analyzeFragments(fragments: Fragment[]): Promise<GraphData> {
  // Send fragments with image data to the server
  const payload = fragments.map((f) => ({
    id: f.id,
    text: f.text,
    image: f.image
      ? { base64: f.image.base64, mimeType: f.image.mimeType }
      : undefined,
  }));

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragments: payload }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Analysis failed: ${response.status}`);
  }

  const data: GraphData = await response.json();
  return data;
}

export async function analyzeSecondary(
  fragments: Fragment[],
  analysis: { connections: GraphData['connections']; ghosts: GraphData['ghosts'] }
): Promise<SecondaryAnalysis> {
  const response = await fetch('/api/analyze/secondary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragments, analysis }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Secondary analysis failed: ${response.status}`);
  }

  const data: SecondaryAnalysis = await response.json();
  return data;
}
