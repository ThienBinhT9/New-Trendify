import { MessageRequestEntity } from "./message-request.entity";
import { EMessageRequestStatus } from "./message-request.type";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IMessageRequestRepository {
  /**
   * Create a new message request.
   */
  create(entity: MessageRequestEntity): Promise<MessageRequestEntity>;

  /**
   * Find message request by ID.
   */
  findById(id: string): Promise<MessageRequestEntity | null>;

  /**
   * Find an existing pending request between two users.
   */
  findPending(senderId: string, recipientId: string): Promise<MessageRequestEntity | null>;

  /**
   * Find all requests for a recipient with cursor-based pagination.
   */
  findByRecipient(
    recipientId: string,
    options: {
      limit: number;
      cursor?: string;
      status?: EMessageRequestStatus;
    },
  ): Promise<{ requests: MessageRequestEntity[]; nextCursor?: string }>;

  /**
   * Update request status (accept/decline).
   */
  updateStatus(requestId: string, status: EMessageRequestStatus): Promise<void>;

  /**
   * Count pending requests for a user.
   */
  countPending(recipientId: string): Promise<number>;

  /**
   * Delete a message request.
   */
  delete(requestId: string): Promise<void>;
}
