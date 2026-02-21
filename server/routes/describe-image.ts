import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export const describeImageRoute = Router();

let anthropic: Anthropic;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

const IMAGE_READING_PROMPT = `You are reading an image as if it were a text fragment — not describing what's in it, but interpreting what it MEANS.

Look at this image and provide:

1. **surface**: What is literally depicted? One sentence.
2. **mood**: What emotional or atmospheric quality does this image carry? One sentence.
3. **metaphor**: If this image were a philosophical statement, what would it be saying? One sentence.
4. **fragment**: Distill this image into a single evocative sentence (under 20 words) that captures its conceptual essence — as if someone wrote it down as an idea, not a description. This should feel like it belongs alongside text fragments like "Bread is architecture" or "Hurt people hurt people."

Return ONLY valid JSON:
{
  "surface": "...",
  "mood": "...",
  "metaphor": "...",
  "fragment": "..."
}`;

interface DescribeRequest {
  image: {
    base64: string;
    mimeType: string;
  };
}

describeImageRoute.post('/describe-image', async (req, res) => {
  try {
    const { image } = req.body as DescribeRequest;

    if (!image || !image.base64 || !image.mimeType) {
      res.status(400).json({ error: 'Image with base64 and mimeType required' });
      return;
    }

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mimeType as any,
                data: image.base64,
              },
            },
            {
              type: 'text',
              text: IMAGE_READING_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response' });
      return;
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (error: unknown) {
    console.error('Image description error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});
