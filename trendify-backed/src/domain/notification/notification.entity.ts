import {
  AGGREGATED_NOTIFICATION_TYPES,
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

  /**
   * Primary actor ID.
   * - Non-aggregated: returns actorId
   * - Aggregated: returns the first (newest) actor in latestActors
   */
  get actorId(): string {
    return this.props.actorId ?? this.props.latestActors[0] ?? "";
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

  get latestActors(): string[] {
    return this.props.latestActors;
  }

  get totalActorCount(): number {
    return this.props.totalActorCount;
  }

  get isAggregated(): boolean {
    return AGGREGATED_NOTIFICATION_TYPES.includes(this.props.type);
  }

  // --------------------------------------------------------------------------
  // Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Self-notification check: không gửi notification cho chính mình
   */
  isSelfNotification(): boolean {
    return this.props.recipientId === this.actorId;
  }

  markAsRead(): void {
    this.props.isRead = true;
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory — for NON-AGGREGATED types only
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
      latestActors: [],
      totalActorCount: 1,
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
