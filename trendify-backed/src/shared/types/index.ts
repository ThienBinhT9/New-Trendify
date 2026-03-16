export interface AppConfig {
  port: number | string;
}

export interface DbConfig {
  host: string;
  port: string;
  name: string;
}

export interface EnvConfig {
  app: AppConfig;
  db: DbConfig;
}
