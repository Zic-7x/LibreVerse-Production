export interface DatabaseProbe {
  ping(): Promise<boolean>;
}
