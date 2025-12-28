import { IAnalysisResult } from './IAnalysisResult';

interface IApiResponse {
  success: boolean;
  data?: IAnalysisResult;
  error?: string;
  timestamp: number;
}

export type { IApiResponse };
