// ============================================================================
// ENUMS
// ============================================================================

export enum EViewedResourceType {
  USER = "user",
  POST = "post",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface IRecentlyViewedProps {
  userId: string;
  resourceId: string;
  resourceType: EViewedResourceType;
  viewedAt: Date;
}

export interface IRecentlyViewedCreateInput {
  userId: string;
  resourceId: string;
  resourceType: EViewedResourceType;
}
