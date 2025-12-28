import { HypeFlagType, FlagSeverity } from '../enums';

interface IHypeFlag {
  type: HypeFlagType;
  message: string;
  severity: FlagSeverity;
  details?: string;
}

export type { IHypeFlag };
