import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PROFESSOR_ALAN_SYSTEM_PROMPT, buildProfessorAlanPrompt } from '../prompts/professor-alan.js';

export const analyzeSecondaryRoute = Router();

let anthropic: Anthropic;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

interface AnalyzeSecondaryRequest {
  fragments: Array<{ id: string; text: string }>;
  analysis: {
    connections: any[];
    ghosts: any[];
  };
}

analyzeSecondaryRoute.post('/analyze/secondary', async (req, res) => {
  try {
    const { fragments, analysis } = req.body as AnalyzeSecondaryRequest;

    // Validate request
    if (!fragments || !Array.isArray(fragments) || fragments.length < 1) {
      res.status(400).json({ error: 'At least 1 fragment is required' });
      return;
    }

    for (const f of fragments) {
      if (!f.id || !f.text) {
        res.status(400).json({ error: 'Each fragment must have an id and text field' });
        return;
      }
    }

    if (!analysis || !analysis.connections) {
      res.status(400).json({ error: 'Primary analysis is required' });
      return;
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

    // Extract text content from the response
    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from Claude' });
      return;
    }

    // Parse JSON — Claude may wrap it in markdown code fences
    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    // Default empty arrays for missing fields
    if (!data.clusters) {
      data.clusters = [];
    }
    if (!data.threads) {
      data.threads = [];
    }
    if (!data.synthesis) {
      data.synthesis = '';
    }

    res.json(data);
  } catch (error: unknown) {
    console.error('Secondary analysis error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});
