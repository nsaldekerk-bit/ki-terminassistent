import { z } from "zod";

export const serviceInputSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  areaSize: z.string().max(100).optional(),
  isEmergency: z.boolean().default(false),
  locationId: z.string().uuid().nullable().optional(),
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;
