export interface SearchUsersDTO {
  query: string;
  viewerId: string;
  limit?: number;
  cursor?: string;
}
