import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { PROFESSOR_ALAN_SYSTEM_PROMPT, buildProfessorAlanPrompt } from '../../server/prompts/professor-alan.js';

let anthropic: Anthropic;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fragments, analysis } = req.body as {
      fragments: Array<{ id: string; text: string }>;
      analysis: { connections: any[]; ghosts: any[] };
    };

    if (!fragments || !Array.isArray(fragments) || fragments.length < 1) {
      return res.status(400).json({ error: 'At least 1 fragment is required' });
    }

    for (const f of fragments) {
      if (!f.id || !f.text) {
        return res.status(400).json({ error: 'Each fragment must have an id and text field' });
      }
    }

    if (!analysis || !analysis.connections) {
      return res.status(400).json({ error: 'Primary analysis is required' });
    }

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: PROFESSOR_ALAN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildProfessorAlanPrompt(fragments, analysis),
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

    if (!data.clusters) data.clusters = [];
    if (!data.threads) data.threads = [];
    if (!data.synthesis) data.synthesis = '';

    return res.json(data);
  } catch (error: unknown) {
    console.error('Secondary analysis error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
