export interface IConnection {
  label: string;
  host: string;
  user: string;
  password?: string;
  hasPassword?: boolean;
  port: number;
  database?: string;
  multipleStatements?: boolean;
  certPath?: string;
  ssl?: any;
}