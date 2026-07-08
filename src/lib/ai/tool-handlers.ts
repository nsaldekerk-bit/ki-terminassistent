import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getBookableSlots } from "@/lib/availability/slots";
import { createAppointment, SlotUnavailableError } from "@/lib/availability/book";

export interface ToolContext {
  tenantId: string;
  locationId: string;
}

export async function executeTool(name: string, input: Record<string, unknown>, ctx: ToolContext) {
  switch (name) {
    case "list_services":
      return listServices(ctx);
    case "check_availability":
      return checkAvailability(input, ctx);
    case "create_appointment_request":
      return createAppointmentRequest(input, ctx);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function listServices(ctx: ToolContext) {
  const services = await prisma.service.findMany({ where: { tenantId: ctx.tenantId } });
  return {
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      isEmergency: s.isEmergency,
    })),
  };
}

async function checkAvailability(input: Record<string, unknown>, ctx: ToolContext) {
  const serviceId = String(input.serviceId ?? "");
  const fromDate = input.fromDate ? new Date(`${input.fromDate}T00:00:00.000Z`) : new Date();
  const toDate = input.toDate ? new Date(`${input.toDate}T00:00:00.000Z`) : addDays(fromDate, 14);

  const slots = await getBookableSlots({
    tenantId: ctx.tenantId,
    locationId: ctx.locationId,
    serviceId,
    fromDate,
    toDate,
  });

  return { slots: slots.slice(0, 20) };
}

async function createAppointmentRequest(input: Record<string, unknown>, ctx: ToolContext) {
  const serviceId = String(input.serviceId ?? "");
  const startTime = new Date(String(input.startTime ?? ""));
  const customerName = String(input.customerName ?? "");
  const customerPhone = input.customerPhone ? String(input.customerPhone) : undefined;
  const customerEmail = input.customerEmail ? String(input.customerEmail) : undefined;
  const notes = input.notes ? String(input.notes) : undefined;

  const customer = await prisma.customer.create({
    data: {
      tenantId: ctx.tenantId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      notes,
    },
  });

  try {
    const appointment = await createAppointment({
      tenantId: ctx.tenantId,
      locationId: ctx.locationId,
      serviceId,
      customerId: customer.id,
      startTime,
      createdVia: "chat",
    });
    return { success: true, appointmentId: appointment.id, status: appointment.status };
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return { success: false, error: "slot_unavailable" };
    }
    throw error;
  }
}
