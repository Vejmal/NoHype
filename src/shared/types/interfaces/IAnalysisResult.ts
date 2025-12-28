import { RiskLevel } from '../enums';
import { IHypeFlag } from './IHypeFlag';
import { IBuzzwordMatch } from './IBuzzwordMatch';
import { IReviewAnalysis } from './IReviewAnalysis';
import { IProductAlternative } from './IProductAlternative';
import { IPriceHistoryPoint } from './IPriceHistoryPoint';

interface IAnalysisResult {
  id: string;
  hypeScore: number;
  riskLevel: RiskLevel;
  summary: string;
  flags: IHypeFlag[];
  buzzwords: IBuzzwordMatch[];
  reviewAnalysis: IReviewAnalysis;
  alternatives: IProductAlternative[];
  priceHistory?: IPriceHistoryPoint[];
  analyzedAt: number;
}

export type { IAnalysisResult };
