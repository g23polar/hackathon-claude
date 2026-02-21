import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/semantic-analysis.js';

export const analyzeRoute = Router();

let anthropic: Anthropic;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

interface AnalyzeRequest {
  fragments: Array<{ id: string; text: string }>;
}

analyzeRoute.post('/analyze', async (req, res) => {
  try {
    const { fragments } = req.body as AnalyzeRequest;

    // Validate request
    if (!fragments || !Array.isArray(fragments) || fragments.length < 2) {
      res.status(400).json({ error: 'At least 2 fragments are required' });
      return;
    }

    for (const f of fragments) {
      if (!f.id || !f.text) {
        res.status(400).json({ error: 'Each fragment must have an id and text field' });
        return;
      }
    }

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(fragments),
        },
      ],
    });

    // Extract text content from the response
    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from Claude' });
      return;
    }

    // Parse JSON from the response — Claude may wrap it in markdown code fences
    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    // Basic validation of response shape
    if (!data.connections || !Array.isArray(data.connections)) {
      res.status(500).json({ error: 'Invalid response shape: missing connections array' });
      return;
    }
    if (!data.ghosts) {
      data.ghosts = [];
    }
    if (!data.summaries) {
      data.summaries = [];
    }
    if (!data.themes) {
      data.themes = [];
    }

    res.json(data);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});
