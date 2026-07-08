import { z } from "zod";

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(3).max(50).optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
  createdVia: z.enum(["chat", "phone", "manual"]).default("manual"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["requested", "confirmed", "cancelled", "completed"]),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
