import {
  ENotificationType,
  INotificationCreateInput,
  INotificationProps,
} from "./notification.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class NotificationEntity {
  private readonly props: INotificationProps;
  readonly id?: string;

  constructor(props: INotificationProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<INotificationProps> {
    return Object.freeze({ ...this.props });
  }

  get recipientId(): string {
    return this.props.recipientId;
  }

  get actorId(): string {
    return this.props.actorId;
  }

  get type(): ENotificationType {
    return this.props.type;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get referenceId(): string | undefined {
    return this.props.referenceId;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // --------------------------------------------------------------------------
  // Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Self-notification check: không gửi notification cho chính mình
   */
  isSelfNotification(): boolean {
    return this.props.recipientId === this.props.actorId;
  }

  markAsRead(): void {
    this.props.isRead = true;
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: INotificationCreateInput): NotificationEntity {
    const now = new Date();

    const props: INotificationProps = {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      targetId: input.targetId,
      referenceId: input.referenceId,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };

    return new NotificationEntity(props);
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
