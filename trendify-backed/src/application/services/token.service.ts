export interface ITokenService {
  generateRandom(length?: number): string;

  generateKeyPairs(): { publicKey: string; privateKey: string };

  generateOTP(): string;

  hash(token: string): string;

  compareHashes(hashA: string, hashB: string): boolean;
}
