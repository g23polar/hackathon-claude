import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from '../server/prompts/semantic-analysis.js';

let anthropic: Anthropic;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

interface FragmentInput {
  id: string;
  text: string;
  image?: {
    base64: string;
    mimeType: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fragments } = req.body as { fragments: FragmentInput[] };

    if (!fragments || !Array.isArray(fragments) || fragments.length < 2) {
      return res.status(400).json({ error: 'At least 2 fragments are required' });
    }

    for (const f of fragments) {
      if (!f.id || !f.text) {
        return res.status(400).json({ error: 'Each fragment must have an id and text field' });
      }
    }

    const userContent: any[] = [];

    for (const f of fragments) {
      if (f.image) {
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: f.image.mimeType,
            data: f.image.base64,
          },
        });
        userContent.push({
          type: 'text',
          text: `[The image above is fragment ${f.id}: "${f.text}"]`,
        });
      }
    }

    const promptFragments = fragments.map((f) => ({
      id: f.id,
      text: f.text,
      hasImage: !!f.image,
    }));
    userContent.push({
      type: 'text',
      text: buildUserPrompt(promptFragments),
    });

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(500).json({ error: 'No text response from Claude' });
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    if (!data.connections || !Array.isArray(data.connections)) {
      return res.status(500).json({ error: 'Invalid response shape: missing connections array' });
    }
    if (!data.ghosts) data.ghosts = [];
    if (!data.summaries) data.summaries = [];
    if (!data.themes) data.themes = [];
    if (!data.field_reading) data.field_reading = '';
    if (!data.emergent_theme) data.emergent_theme = '';

    return res.json(data);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
