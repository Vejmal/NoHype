export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_TIMEOUT = 30000;

export const CACHE_TTL = 60 * 60 * 1000;

export const DEFAULT_SETTINGS = {
  autoAnalyze: false,
  showNotifications: true,
  language: 'pl' as const,
  alertThreshold: 70,
};

export const BUZZWORDS_PL = {
  marketing: [
    'rewolucyjny', 'przełomowy', 'innowacyjny', 'unikalny',
    'najlepszy', 'nr 1', 'hit', 'bestseller', 'must-have',
    'profesjonalny', 'premium', 'ekskluzywny', 'luksusowy',
  ],
  fake_urgency: [
    'ostatnie sztuki', 'tylko dziś', 'promocja kończy się',
    'limitowana edycja', 'wyprzedaż', 'okazja', 'nie przegap',
    'zostało tylko', 'końcówka serii',
  ],
  exaggeration: [
    'niesamowity', 'niewiarygodny', 'fenomenalny', 'spektakularny',
    'cudowny', 'magiczny', 'idealny', 'perfekcyjny', 'doskonały',
    '100% skuteczny', 'gwarantowany efekt',
  ],
  unverified: [
    'klinicznie przetestowany', 'naukowo udowodniony',
    'rekomendowany przez ekspertów', 'certyfikowany',
    'naturalny', 'organiczny', 'eko', 'bio',
  ],
};

export const BUZZWORDS_EN = {
  marketing: [
    'revolutionary', 'breakthrough', 'innovative', 'unique',
    'best', '#1', 'hit', 'bestseller', 'must-have',
    'professional', 'premium', 'exclusive', 'luxury',
  ],
  fake_urgency: [
    'limited stock', 'today only', 'sale ends',
    'limited edition', 'clearance', 'deal', "don't miss",
    'only left', 'last chance',
  ],
  exaggeration: [
    'amazing', 'incredible', 'phenomenal', 'spectacular',
    'miraculous', 'magical', 'ideal', 'perfect', 'flawless',
    '100% effective', 'guaranteed results',
  ],
  unverified: [
    'clinically tested', 'scientifically proven',
    'expert recommended', 'certified',
    'natural', 'organic', 'eco', 'bio',
  ],
};

export const SOURCE_DOMAINS: Record<string, string[]> = {
  amazon: ['amazon.com', 'amazon.pl', 'amazon.de', 'amazon.co.uk'],
  allegro: ['allegro.pl'],
  aliexpress: ['aliexpress.com'],
  ceneo: ['ceneo.pl'],
  sephora: ['sephora.pl'],
  zalando: ['zalando.pl'],
};

export const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const RISK_LABELS_PL = {
  low: 'Niskie ryzyko',
  medium: 'Średnie ryzyko',
  high: 'Wysokie ryzyko',
  critical: 'Krytyczne!',
};
