import { z } from "zod";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeWindowSchema = z
  .object({
    start: z.string().regex(TIME_PATTERN),
    end: z.string().regex(TIME_PATTERN),
  })
  .refine((w) => w.start < w.end, { message: "start must be before end" });
