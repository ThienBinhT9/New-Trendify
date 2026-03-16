export interface JwtSignOptions {
  expiresIn: string | number;
  algorithm?: "RS256" | "HS256";
  issuer?: string;
  audience?: string;
}

export interface JwtVerifyOptions {
  algorithms?: ("RS256" | "HS256")[];
  issuer?: string;
  audience?: string;
}

export interface JwtPayloadBase {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface IJwtService {
  sign(payload: JwtPayloadBase, secret: string, options?: JwtSignOptions): string;

  verify<T extends JwtPayloadBase>(token: string, secret: string): Promise<T>;

  decode<T extends object = any>(token: string): T | null;
}
