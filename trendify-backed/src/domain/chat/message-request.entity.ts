import {
  EMessageRequestStatus,
  ICreateMessageRequestInput,
  IMessageRequestProps,
} from "./message-request.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class MessageRequestEntity {
  private readonly props: IMessageRequestProps;
  readonly id?: string;

  constructor(props: IMessageRequestProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IMessageRequestProps> {
    return Object.freeze({ ...this.props });
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get recipientId(): string {
    return this.props.recipientId;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get status(): EMessageRequestStatus {
    return this.props.status;
  }

  get message(): string | undefined {
    return this.props.message;
  }

  get isPending(): boolean {
    return this.props.status === EMessageRequestStatus.PENDING;
  }

  get isAccepted(): boolean {
    return this.props.status === EMessageRequestStatus.ACCEPTED;
  }

  get isDeclined(): boolean {
    return this.props.status === EMessageRequestStatus.DECLINED;
  }

  // --------------------------------------------------------------------------
  // Domain Logic
  // --------------------------------------------------------------------------

  accept(): void {
    if (!this.isPending) {
      throw new Error("Only pending message requests can be accepted");
    }
    this.props.status = EMessageRequestStatus.ACCEPTED;
    this.props.updatedAt = new Date();
  }

  decline(): void {
    if (!this.isPending) {
      throw new Error("Only pending message requests can be declined");
    }
    this.props.status = EMessageRequestStatus.DECLINED;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if this request involves a specific user (either as sender or recipient).
   */
  involvesUser(userId: string): boolean {
    return this.props.senderId === userId || this.props.recipientId === userId;
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: ICreateMessageRequestInput): MessageRequestEntity {
    const now = new Date();

    if (input.senderId === input.recipientId) {
      throw new Error("Cannot send message request to yourself");
    }

    return new MessageRequestEntity({
      senderId: input.senderId,
      recipientId: input.recipientId,
      conversationId: input.conversationId,
      status: EMessageRequestStatus.PENDING,
      message: input.message?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  toSnapshot() {
    return {
      id: this.id,
      ...this.props,
    };
  }
}
