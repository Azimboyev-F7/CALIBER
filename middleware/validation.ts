import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || [];
      return res.status(400).json({
        error: 'Validation Error',
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : '',
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
}

export const chatCoachSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(3000, 'Message cannot exceed 3000 characters'),
  history: z
    .array(
      z.object({
        id: z.string().optional(),
        sender: z.string().max(50),
        text: z.string().max(5000),
        timestamp: z.string().optional()
      })
    )
    .max(50)
    .optional()
    .default([]),
  profile: z.record(z.string(), z.any()).optional().default({}),
  analysis: z.record(z.string(), z.any()).optional().default({})
});

export const analyzeProfileSchema = z.object({
  profile: z.object({
    name: z.string().max(200).optional().default(''),
    intendedMajor: z.string().max(200).optional().default(''),
    graduationYear: z.string().max(50).optional().default('2026'),
    unweightedGpa: z.string().max(50).optional().default(''),
    weightedGpa: z.string().max(50).optional().default(''),
    satScore: z.string().max(50).optional().default(''),
    actScore: z.string().max(50).optional().default(''),
    ieltsScore: z.string().max(50).optional().default(''),
    preferredCountry: z.string().max(100).optional().default('United States'),
    budgetPerYear: z.string().max(100).optional().default('Flexible'),
    apIbHonorsCount: z.string().max(50).optional().default('0'),
    contextNotes: z.string().max(5000).optional().default(''),
    activities: z.array(z.any()).max(30).optional().default([]),
    awards: z.array(z.any()).max(30).optional().default([])
  }).passthrough()
});

export const optimizeActivitySchema = z.object({
  activityTitle: z.string().max(200, 'Activity title cannot exceed 200 characters').optional().default(''),
  role: z.string().max(200, 'Role cannot exceed 200 characters').optional().default(''),
  roughDescription: z.string().max(2000, 'Rough description cannot exceed 2000 characters').optional().default('')
});

export const recommendCollegesSchema = z.object({
  profile: z.record(z.string(), z.any()),
  filterTier: z.string().max(100).optional(),
  filterRegion: z.string().max(100).optional()
});
