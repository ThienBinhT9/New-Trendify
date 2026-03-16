export interface IPasswordService {
  hash(raw: string): string;
  compare(raw: string, hashed: string): boolean;
}
