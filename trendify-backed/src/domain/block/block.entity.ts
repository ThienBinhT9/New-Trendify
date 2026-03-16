import { IBlockProps, ICreateBlockProps } from "./block.type";

/**
 * Block Entity - Represents a block relationship between two users
 */
export class BlockEntity {
  constructor(
    private readonly props: IBlockProps,
    public readonly id?: string,
  ) {}

  /**
   * Get immutable copy of entity data
   */
  get data(): Readonly<IBlockProps> {
    return Object.freeze({ ...this.props });
  }

  /**
   * Factory method to create a new block relationship
   */
  static create(props: ICreateBlockProps): BlockEntity {
    const now = new Date();

    return new BlockEntity({
      blockerId: props.blockerId,
      blockedId: props.blockedId,
      reason: props.reason,
      createdAt: now,
    });
  }

  /**
   * Reconstruct entity from database
   */
  static fromPersistence(props: IBlockProps, id: string): BlockEntity {
    return new BlockEntity(props, id);
  }

  /**
   * Convert to plain object for database storage
   */
  toSnapshot(): IBlockProps & { id?: string } {
    return {
      id: this.id,
      ...this.props,
    };
  }

  /**
   * Check if this block is between specific users
   */
  isBetween(blockerId: string, blockedId: string): boolean {
    return this.props.blockerId === blockerId && this.props.blockedId === blockedId;
  }

  /**
   * Check if user is the blocker
   */
  isBlocker(userId: string): boolean {
    return this.props.blockerId === userId;
  }

  /**
   * Check if user is blocked
   */
  isBlocked(userId: string): boolean {
    return this.props.blockedId === userId;
  }
}
