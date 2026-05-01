import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    date:        z.coerce.date(),
    category:    z.enum(['AI', 'Legal', 'Technology', 'Business', 'Tips']),
    author:      z.string().default('Berynex'),
    draft:       z.boolean().default(false),
  }),
});

export const collections = { blog };
