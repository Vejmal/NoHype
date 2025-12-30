import { IUserSettings } from './IUserSettings';
import { IAnalysisHistoryItem } from './IAnalysisHistoryItem';
import { IAnalysisResult } from './IAnalysisResult';

interface IStorageData {
  settings: IUserSettings;
  history: IAnalysisHistoryItem[];
  cache: Record<string, IAnalysisResult>;
}

export type { IStorageData };
