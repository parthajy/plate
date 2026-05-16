import Anthropic from '@anthropic-ai/sdk';
import { Recipe, type RecipeFilters, type Recipe as RecipeT } from '@plate/shared';
import { config } from '../../config.js';
import { AppError } from '../../lib/errors.js';
import { assertWithinBudget, recordUsage } from '../usage.js';
import { RECIPE_SYSTEM } from './prompts/recipe.js';

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (cached) return cached;
  if (!config.ANTHROPIC_API_KEY) {
    throw new AppError('AI_NOT_CONFIGURED', 'Anthropic API key not set', 500);
  }
  cached = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return cached;
}

const RECIPE_MODEL = 'claude-sonnet-4-6';

const RecipeTool: Anthropic.Tool = {
  name: 'propose_recipe',
  description:
    "Return one cookable recipe that uses the user's pantry ingredients " +
    'and respects all filters. Call exactly once.',
  // @ts-expect-error — strict is API-supported, SDK typing trailing
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'title',
      'servings',
      'totalMinutes',
      'ingredients',
      'steps',
      'macrosPerServing',
      'pantryUsed',
      'missing',
    ],
    properties: {
      title: { type: 'string', description: 'Specific recipe name.' },
      description: {
        type: 'string',
        description: 'One sentence about why this recipe fits.',
      },
      servings: { type: 'integer', description: 'Servings the recipe makes.' },
      totalMinutes: { type: 'integer', description: 'Total prep + cook time.' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'grams'],
          properties: {
            name: { type: 'string' },
            grams: { type: 'number' },
            optional: { type: 'boolean' },
          },
        },
      },
      steps: {
        type: 'array',
        items: { type: 'string', description: 'One step, plain text.' },
      },
      macrosPerServing: {
        type: 'object',
        additionalProperties: false,
        required: ['kcal', 'proteinG', 'carbsG', 'fatG'],
        properties: {
          kcal: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
        },
      },
      pantryUsed: {
        type: 'array',
        items: { type: 'string' },
        description: 'User pantry ingredients you actually used (subset, by name).',
      },
      missing: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ingredients the recipe needs but the user did not list (e.g. salt, oil).',
      },
    },
  },
};

function renderUserMessage(pantry: string[], filters: RecipeFilters | undefined): string {
  const lines: string[] = [];
  lines.push('Pantry (ingredients I have on hand):');
  if (pantry.length === 0) {
    lines.push('  (empty — pick the closest reasonable dish and put everything in missing)');
  } else {
    for (const item of pantry) lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('Filters:');
  if (!filters || Object.keys(filters).length === 0) {
    lines.push('  (none)');
  } else {
    if (filters.maxMinutes != null) lines.push(`- max total time: ${filters.maxMinutes} minutes`);
    if (filters.highProtein) lines.push('- high protein (≥30g per serving)');
    if (filters.lowCarb) lines.push('- low carb (≤25g per serving)');
    if (filters.vegetarian) lines.push('- vegetarian (no meat/fish/poultry; eggs and dairy OK)');
  }
  lines.push('');
  lines.push('Propose one recipe via the propose_recipe tool.');
  return lines.join('\n');
}

export async function generateRecipe(
  userId: string,
  pantry: string[],
  filters: RecipeFilters | undefined,
): Promise<RecipeT> {
  await assertWithinBudget(userId, 'recipe');
  const response = await client().messages.create({
    model: RECIPE_MODEL,
    max_tokens: 1400,
    system: [{ type: 'text', text: RECIPE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    tools: [RecipeTool],
    tool_choice: { type: 'tool', name: 'propose_recipe' },
    messages: [{ role: 'user', content: renderUserMessage(pantry, filters) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new AppError('RECIPE_REFUSED', 'Could not generate a recipe', 422);
  }

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (!toolBlock) {
    throw new AppError('RECIPE_NO_RESULT', 'Model did not return a recipe', 502);
  }

  const parsed = Recipe.safeParse(toolBlock.input);
  if (!parsed.success) {
    throw new AppError('RECIPE_INVALID', 'Recipe response failed validation', 502, {
      issues: parsed.error.issues,
    });
  }
  await recordUsage({
    userId,
    kind: 'recipe',
    model: RECIPE_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });
  return parsed.data;
}
