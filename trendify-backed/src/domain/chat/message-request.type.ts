// ============================================================================
// ENUMS
// ============================================================================

export enum EMessageRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface IMessageRequestProps {
  senderId: string;
  recipientId: string;
  conversationId: string;
  status: EMessageRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface ICreateMessageRequestInput {
  senderId: string;
  recipientId: string;
  conversationId: string;
  message?: string;
}
