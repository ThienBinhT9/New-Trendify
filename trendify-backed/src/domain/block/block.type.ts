/**
 * Block entity properties
 */
export interface IBlockProps {
  /** User who initiated the block */
  blockerId: string;

  /** User who is being blocked */
  blockedId: string;

  /** Optional reason for blocking */
  reason?: string;

  /** When the block was created */
  createdAt: Date;
}

/**
 * Properties required to create a new block
 */
export interface ICreateBlockProps {
  blockerId: string;
  blockedId: string;
  reason?: string;
}

/**
 * Block reasons enum (optional - for UI/analytics)
 */
export enum EBlockReason {
  SPAM = "SPAM",
  HARASSMENT = "HARASSMENT",
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  UNWANTED_CONTACT = "UNWANTED_CONTACT",
  OTHER = "OTHER",
}
