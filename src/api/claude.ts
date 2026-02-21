import type { Fragment, GraphData, SecondaryAnalysis } from '../types';

interface ImageReading {
  surface: string;
  mood: string;
  metaphor: string;
  fragment: string;
}

export async function describeImage(image: { base64: string; mimeType: string }): Promise<ImageReading> {
  const response = await fetch('/api/describe-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });

  if (!response.ok) {
    throw new Error('Image description failed');
  }

  return response.json();
}

export async function analyzeFragments(fragments: Fragment[]): Promise<GraphData> {
  // Pre-process: describe any images that haven't been read yet
  const enrichedFragments = await Promise.all(
    fragments.map(async (f) => {
      if (f.image && !f.image.reading) {
        try {
          const reading = await describeImage({
            base64: f.image.base64,
            mimeType: f.image.mimeType,
          });
          return {
            ...f,
            image: { ...f.image, reading },
          };
        } catch (err) {
          console.error('Image description failed for', f.id, err);
          return f;
        }
      }
      return f;
    })
  );

  // Build payload — for image fragments, send the enriched text + image
  const payload = enrichedFragments.map((f) => {
    if (f.image?.reading) {
      return {
        id: f.id,
        // The text sent to the cartographer is the AI-generated fragment + context
        text: `[IMAGE] ${f.image.reading.fragment} (${f.image.reading.mood} ${f.image.reading.metaphor})`,
        image: { base64: f.image.base64, mimeType: f.image.mimeType },
      };
    }
    return {
      id: f.id,
      text: f.text,
      image: f.image ? { base64: f.image.base64, mimeType: f.image.mimeType } : undefined,
    };
  });

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
