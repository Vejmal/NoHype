interface IUserSettings {
  autoAnalyze: boolean;
  showNotifications: boolean;
  language: 'pl' | 'en';
  alertThreshold: number;
}

export type { IUserSettings };
