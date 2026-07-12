import { z } from "zod";

// A base64 image data URL. Photos are compressed client-side before upload,
// so the per-image cap stays comfortably above a compressed JPEG but well
// below anything that would bloat the request body.
const photoDataUrl = z
  .string()
  .startsWith("data:image/")
  .max(3_000_000);

export const bookingRequestSchema = z.object({
  tenantSlug: z.string().min(1),
  type: z.enum(["consultation", "booking"]),
  serviceId: z.string().uuid().nullish(),
  serviceLabel: z.string().max(200).nullish(),
  areaText: z.string().max(100).nullish(),
  situation: z.string().max(4000).nullish(),
  address: z.string().max(300).nullish(),
  preferredDate: z.string().max(40).nullish(),
  preferredTime: z.string().max(60).nullish(),
  slotStart: z.string().datetime().nullish(),
  slotEnd: z.string().datetime().nullish(),
  customer: z.object({
    vorname: z.string().min(1).max(100),
    nachname: z.string().min(1).max(100),
    email: z.string().email().max(200),
    telefon: z.string().min(5).max(50),
  }),
  photos: z.array(photoDataUrl).max(6).default([]),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
