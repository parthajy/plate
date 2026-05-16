import Anthropic from '@anthropic-ai/sdk';
import { ScanResultSchema, type ScanResult } from '@plate/shared';
import { config } from '../../config.js';
import { AppError } from '../../lib/errors.js';
import { assertWithinBudget, recordUsage } from '../usage.js';
import { FOOD_VISION_SYSTEM } from './prompts/vision.js';

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (cached) return cached;
  if (!config.ANTHROPIC_API_KEY) {
    throw new AppError('AI_NOT_CONFIGURED', 'Anthropic API key not set', 500);
  }
  cached = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return cached;
}

const VISION_MODEL = 'claude-sonnet-4-6';

const FoodTool: Anthropic.Tool = {
  name: 'report_food_estimate',
  description:
    "Report your single best estimate for the food in the user's photo. " +
    'You MUST call this tool exactly once.',
  // @ts-expect-error — `strict` is in the API but not yet in this SDK typing
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['foodName', 'portionGrams', 'kcal', 'proteinG', 'carbsG', 'fatG', 'confidence'],
    properties: {
      foodName: {
        type: 'string',
        description:
          "Specific dish name. 'grilled chicken thigh' not 'meat'. 'iced oat milk latte' not 'drink'.",
      },
      brand: {
        type: 'string',
        description:
          'Visible brand or chain (e.g. "Chobani", "Chipotle") if obvious from packaging.',
      },
      portionGrams: {
        type: 'number',
        description: 'Edible weight in grams.',
      },
      kcal: { type: 'number', description: 'Total calories for the estimated portion.' },
      proteinG: { type: 'number' },
      carbsG: { type: 'number' },
      fatG: { type: 'number' },
      confidence: {
        type: 'number',
        description: '0..1 — how confident you are in the estimate.',
      },
      notes: {
        type: 'string',
        description: 'Brief caveat about the estimate (e.g. "portion guessed from 9-inch plate").',
      },
    },
  },
};

export async function analyzeFoodImage(userId: string, imageUrl: string): Promise<ScanResult> {
  await assertWithinBudget(userId, 'scan');
  const response = await client().messages.create({
    model: VISION_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: FOOD_VISION_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [FoodTool],
    tool_choice: { type: 'tool', name: 'report_food_estimate' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: 'Analyze this food photo. Call the tool with your best estimate.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new AppError('SCAN_REFUSED', 'Could not analyze this photo', 422);
  }

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (!toolBlock) {
    throw new AppError('SCAN_NO_RESULT', 'Model did not return an estimate', 502);
  }

  const parsed = ScanResultSchema.safeParse(toolBlock.input);
  if (!parsed.success) {
    throw new AppError('SCAN_INVALID', 'Vision response failed validation', 502, {
      issues: parsed.error.issues,
    });
  }
  await recordUsage({
    userId,
    kind: 'scan',
    model: VISION_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });
  return parsed.data;
}
