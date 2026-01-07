/**
 * Seed Prompts Utility
 *
 * Seeds default prompts into the database
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { DEFAULT_PROMPTS } from '../data/defaultPrompts';

const client = generateClient<Schema>();

/**
 * Seed default prompts into database
 */
export async function seedDefaultPrompts(): Promise<void> {
  console.log('Seeding default prompts...');

  for (const prompt of DEFAULT_PROMPTS) {
    try {
      // Check if prompt already exists
      const existingResult = await client.models.Prompt.list({
        filter: {
          name: { eq: prompt.name },
          scope: { eq: 'global' },
        },
      });

      if (existingResult.data && existingResult.data.length > 0) {
        console.log(`Prompt "${prompt.name}" already exists, skipping...`);
        continue;
      }

      // Create prompt
      await client.models.Prompt.create({
        name: prompt.name,
        description: prompt.description,
        template: prompt.template,
        scope: 'global',
        version: 1,
        tags: prompt.tags,
        genre: prompt.genre,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`Created prompt: ${prompt.name}`);
    } catch (error) {
      console.error(`Error creating prompt "${prompt.name}":`, error);
    }
  }

  console.log('Default prompts seeded successfully!');
}
