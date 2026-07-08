export interface HandleIncomingMessageInput {
  tenantId: string;
  conversationId?: string;
  customerId?: string;
  message: string;
  locale?: string;
}

export interface HandleIncomingMessageResult {
  conversationId: string;
  reply: string;
  escalated: boolean;
}
