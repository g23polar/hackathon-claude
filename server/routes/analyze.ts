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

interface FragmentInput {
  id: string;
  text: string;
  image?: {
    base64: string;
    mimeType: string;
  };
}

interface AnalyzeRequest {
  fragments: FragmentInput[];
}

analyzeRoute.post('/analyze', async (req, res) => {
  try {
    const { fragments } = req.body as AnalyzeRequest;

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

    // Build the user message content — mix of text and images
    const userContent: any[] = [];

    // Add images first so Claude sees them before the text prompt
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
        // Label the image
        userContent.push({
          type: 'text',
          text: `[The image above is fragment ${f.id}: "${f.text}"]`,
        });
      }
    }

    // Add the main text prompt
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
      res.status(500).json({ error: 'No text response from Claude' });
      return;
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    if (!data.connections || !Array.isArray(data.connections)) {
      res.status(500).json({ error: 'Invalid response shape: missing connections array' });
      return;
    }
    if (!data.ghosts) data.ghosts = [];
    if (!data.summaries) data.summaries = [];
    if (!data.themes) data.themes = [];
    if (!data.field_reading) data.field_reading = '';
    if (!data.emergent_theme) data.emergent_theme = '';

    res.json(data);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});
