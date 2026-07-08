import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "list_services",
    description:
      "List all services this business offers, including their ID, duration, category, and price if available. Call this before checking availability or booking.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "check_availability",
    description:
      "Check which appointment slots are actually bookable for a given service. Defaults to the next 14 days if no date range is given. Only offer slots returned by this tool - never invent times.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: {
          type: "string",
          description: "The ID of the service, from list_services.",
        },
        fromDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD) to start searching from. Optional, defaults to today.",
        },
        toDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD) to search until. Optional, defaults to 14 days from fromDate.",
        },
      },
      required: ["serviceId"],
    },
  },
  {
    name: "create_appointment_request",
    description:
      "Book an appointment once the customer has chosen a service and a specific slot returned by check_availability, and you have at least their name and a phone number or email to reach them.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string" },
        startTime: {
          type: "string",
          description: "ISO 8601 datetime of the chosen slot, exactly as returned by check_availability.",
        },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        customerEmail: { type: "string" },
        notes: { type: "string", description: "Any extra context the customer shared about the request." },
      },
      required: ["serviceId", "startTime", "customerName"],
    },
  },
];
