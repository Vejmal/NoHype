import { ProductSource, RiskLevel } from '../enums';

interface IAnalysisHistoryItem {
  id: string;
  productName: string;
  source: ProductSource;
  url: string;
  hypeScore: number;
  riskLevel: RiskLevel;
  analyzedAt: number;
}

export type { IAnalysisHistoryItem };
