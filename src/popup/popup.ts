import type { IProductData, IAnalysisResult, IHypeFlag } from '../shared/types/index';
import { RiskLevel, Currency } from '../shared/types/index';

const loadingState = document.getElementById('loading-state')!;
const noProductState = document.getElementById('no-product-state')!;
const resultsState = document.getElementById('results-state')!;
const errorState = document.getElementById('error-state')!;

const productImage = document.getElementById('product-image') as HTMLImageElement;
const productName = document.getElementById('product-name')!;
const productPrice = document.getElementById('product-price')!;
const productOriginalPrice = document.getElementById('product-original-price')!;
const productRating = document.getElementById('product-rating')!;

const scoreValue = document.getElementById('score-value')!;
const scoreProgress = document.getElementById('score-progress')!;
const riskBadge = document.getElementById('risk-badge')!;
const summaryText = document.getElementById('summary-text')!;

const metricDescription = document.getElementById('metric-description')!;
const metricPrice = document.getElementById('metric-price')!;
const metricReviews = document.getElementById('metric-reviews')!;
const metricFlags = document.getElementById('metric-flags')!;

const flagsCount = document.getElementById('flags-count')!;
const flagsList = document.getElementById('flags-list')!;
const buzzwordCount = document.getElementById('buzzword-count')!;
const reviewCredibility = document.getElementById('review-credibility')!;
const productSource = document.getElementById('product-source')!;

const analyzeBtn = document.getElementById('analyze-btn')!;
const retryBtn = document.getElementById('retry-btn')!;
const errorMessage = document.getElementById('error-message')!;
const settingsBtn = document.getElementById('settings-btn')!;
const settingsPanel = document.getElementById('settings-panel')!;
const settingsBack = document.getElementById('settings-back')!;

let currentProduct: IProductData | null = null;
let currentAnalysis: IAnalysisResult | null = null;

interface UserSettings {
  autoAnalyze: boolean;
  showNotifications: boolean;
  showWidget: boolean;
  warningThreshold: number;
}

const defaultSettings: UserSettings = {
  autoAnalyze: true,
  showNotifications: true,
  showWidget: true,
  warningThreshold: 50,
};

async function init(): Promise<void> {
  console.log('[NoHype] Popup initialized');

  analyzeBtn.addEventListener('click', handleAnalyze);
  retryBtn.addEventListener('click', handleRetry);
  
  initTabs();
  initSettings();

  await loadProductData();
}

function initTabs(): void {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`)?.classList.add('active');
    });
  });
}

function initSettings(): void {
  settingsBtn.addEventListener('click', openSettings);
  settingsBack.addEventListener('click', closeSettings);
  
  loadSettings();
  
  const autoAnalyze = document.getElementById('setting-auto-analyze') as HTMLInputElement;
  const notifications = document.getElementById('setting-notifications') as HTMLInputElement;
  const showWidget = document.getElementById('setting-show-widget') as HTMLInputElement;
  const warningThreshold = document.getElementById('setting-warning-threshold') as HTMLSelectElement;
  const clearHistory = document.getElementById('clear-history')!;
  const clearCache = document.getElementById('clear-cache')!;
  
  autoAnalyze?.addEventListener('change', () => saveSetting('autoAnalyze', autoAnalyze.checked));
  notifications?.addEventListener('change', () => saveSetting('showNotifications', notifications.checked));
  showWidget?.addEventListener('change', () => saveSetting('showWidget', showWidget.checked));
  warningThreshold?.addEventListener('change', () => saveSetting('warningThreshold', parseInt(warningThreshold.value)));
  
  clearHistory?.addEventListener('click', handleClearHistory);
  clearCache?.addEventListener('click', handleClearCache);
}

function openSettings(): void {
  settingsPanel.classList.remove('hidden');
  requestAnimationFrame(() => {
    settingsPanel.classList.add('visible');
  });
}

function closeSettings(): void {
  settingsPanel.classList.remove('visible');
  setTimeout(() => {
    settingsPanel.classList.add('hidden');
  }, 300);
}

async function loadSettings(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings: UserSettings = { ...defaultSettings, ...result.settings };
    
    const autoAnalyze = document.getElementById('setting-auto-analyze') as HTMLInputElement;
    const notifications = document.getElementById('setting-notifications') as HTMLInputElement;
    const showWidget = document.getElementById('setting-show-widget') as HTMLInputElement;
    const warningThreshold = document.getElementById('setting-warning-threshold') as HTMLSelectElement;
    
    if (autoAnalyze) autoAnalyze.checked = settings.autoAnalyze;
    if (notifications) notifications.checked = settings.showNotifications;
    if (showWidget) showWidget.checked = settings.showWidget;
    if (warningThreshold) warningThreshold.value = settings.warningThreshold.toString();
  } catch (error) {
    console.error('[NoHype] Error loading settings:', error);
  }
}

async function saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings: UserSettings = { ...defaultSettings, ...result.settings };
    settings[key] = value;
    await chrome.storage.local.set({ settings });
    console.log('[NoHype] Setting saved:', key, value);
  } catch (error) {
    console.error('[NoHype] Error saving setting:', error);
  }
}

async function handleClearHistory(): Promise<void> {
  if (confirm('Czy na pewno chcesz wyczyścić historię analiz?')) {
    try {
      await chrome.storage.local.remove('history');
      alert('Historia została wyczyszczona.');
    } catch (error) {
      console.error('[NoHype] Error clearing history:', error);
      alert('Wystąpił błąd podczas czyszczenia historii.');
    }
  }
}

async function handleClearCache(): Promise<void> {
  if (confirm('Czy na pewno chcesz wyczyścić cache?')) {
    try {
      await chrome.storage.local.remove('cache');
      alert('Cache został wyczyszczony.');
    } catch (error) {
      console.error('[NoHype] Error clearing cache:', error);
      alert('Wystąpił błąd podczas czyszczenia cache.');
    }
  }
}

async function loadProductData(): Promise<void> {
  showState('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id || !tab.url) {
      showState('no-product');
      return;
    }

    const supportedDomains = [
      'amazon.com', 'amazon.pl', 'amazon.de', 'amazon.co.uk',
      'allegro.pl', 'aliexpress.com', 'ceneo.pl', 'sephora.pl', 'zalando.pl'
    ];

    const isSupported = supportedDomains.some(domain => tab.url?.includes(domain));
    
    if (!isSupported) {
      showState('no-product');
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { type: 'GET_PRODUCT_DATA', payload: null },
      async (response: { success: boolean; data?: IProductData }) => {
        if (chrome.runtime.lastError) {
          console.error('[NoHype] Error:', chrome.runtime.lastError);
          showState('no-product');
          return;
        }

        if (response?.success && response.data) {
          currentProduct = response.data;
          await analyzeProduct(response.data);
        } else {
          showState('no-product');
        }
      }
    );
  } catch (error) {
    console.error('[NoHype] Error loading product:', error);
    showError('Nie udało się załadować danych produktu.');
  }
}

async function analyzeProduct(product: IProductData): Promise<void> {
  showState('loading');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_PRODUCT',
      payload: product,
    }) as { success: boolean; data?: IAnalysisResult; error?: string };

    if (response?.success && response.data) {
      currentAnalysis = response.data;
      displayResults(product, response.data);
    } else {
      showError(response?.error || 'Analiza nie powiodła się.');
    }
  } catch (error) {
    console.error('[NoHype] Analysis error:', error);
    showError('Wystąpił błąd podczas analizy.');
  }
}

function displayResults(product: IProductData, analysis: IAnalysisResult): void {
  if (product.imageUrl) {
    productImage.src = product.imageUrl;
    productImage.style.display = 'block';
  } else {
    productImage.style.display = 'none';
  }

  productName.textContent = truncate(product.name, 45);
  productPrice.textContent = formatPrice(product.price, product.currency);

  if (product.originalPrice && product.originalPrice > product.price) {
    productOriginalPrice.textContent = formatPrice(product.originalPrice, product.currency);
    productOriginalPrice.style.display = 'inline';
  } else {
    productOriginalPrice.style.display = 'none';
  }

  if (product.rating && product.reviewCount) {
    productRating.textContent = `⭐ ${product.rating.toFixed(1)} (${product.reviewCount} opinii)`;
  } else {
    productRating.textContent = '';
  }

  animateScore(analysis.hypeScore);
  updateRiskBadge(analysis.riskLevel);
  summaryText.textContent = analysis.summary;

  updateMetrics(product, analysis);
  updateDetails(product, analysis);
  updateFlags(analysis);

  showState('results');
}

function updateMetrics(product: IProductData, analysis: IAnalysisResult): void {
  const descScore = analysis.buzzwords.length;
  metricDescription.textContent = descScore === 0 ? 'OK' : `${descScore}`;
  metricDescription.className = `metric-status ${descScore === 0 ? 'ok' : descScore < 3 ? 'warn' : 'bad'}`;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  metricPrice.textContent = hasDiscount ? 'Promocja' : 'OK';
  metricPrice.className = `metric-status ${hasDiscount ? 'warn' : 'ok'}`;

  const suspiciousReviews = analysis.reviewAnalysis?.suspiciousPercentage ?? 0;
  const reviewScore = 100 - suspiciousReviews;
  metricReviews.textContent = reviewScore >= 70 ? 'OK' : reviewScore >= 40 ? '⚠️' : '❌';
  metricReviews.className = `metric-status ${reviewScore >= 70 ? 'ok' : reviewScore >= 40 ? 'warn' : 'bad'}`;

  const flagCount = analysis.flags.length;
  metricFlags.textContent = flagCount.toString();
  metricFlags.className = `metric-status ${flagCount === 0 ? 'ok' : flagCount < 3 ? 'warn' : 'bad'}`;
  flagsCount.textContent = flagCount.toString();
}

function updateDetails(product: IProductData, analysis: IAnalysisResult): void {
  buzzwordCount.textContent = analysis.buzzwords.length.toString();
  
  const suspiciousReviews = analysis.reviewAnalysis?.suspiciousPercentage ?? null;
  const credibility = suspiciousReviews !== null ? 100 - suspiciousReviews : null;
  reviewCredibility.textContent = credibility !== null ? `${credibility}%` : '—';
  
  productSource.textContent = product.source;
}

function updateFlags(analysis: IAnalysisResult): void {
  if (analysis.flags.length > 0) {
    flagsList.innerHTML = analysis.flags.map((flag: IHypeFlag) => `
      <div class="flag-item ${flag.severity}">
        <span class="flag-icon">${getSeverityIcon(flag.severity)}</span>
        <span class="flag-text">${flag.message}</span>
      </div>
    `).join('');
  } else {
    flagsList.innerHTML = '<p class="empty-message">Brak ostrzeżeń</p>';
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'info': return 'ℹ️';
    case 'warning': return '⚠️';
    case 'danger': return '🚨';
    default: return '⚠️';
  }
}

function animateScore(score: number): void {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  let currentValue = 0;
  const duration = 1000;
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    currentValue = Math.round(score * progress);
    scoreValue.textContent = currentValue.toString();

    const color = getScoreColor(currentValue);
    scoreValue.style.color = color;
    scoreProgress.style.stroke = color;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  setTimeout(() => {
    scoreProgress.style.strokeDashoffset = offset.toString();
  }, 100);

  requestAnimationFrame(animate);
}

function getScoreColor(score: number): string {
  if (score < 30) return '#22c55e';
  if (score < 50) return '#f59e0b';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

function getScoreClass(score: number): string {
  if (score < 30) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

function updateRiskBadge(risk: RiskLevel): void {
  const labels: Record<RiskLevel, string> = {
    [RiskLevel.Low]: 'Niskie ryzyko',
    [RiskLevel.Medium]: 'Średnie ryzyko',
    [RiskLevel.High]: 'Wysokie ryzyko',
    [RiskLevel.Critical]: 'Krytyczne!',
  };

  const riskText = riskBadge.querySelector('.risk-text');
  if (riskText) {
    riskText.textContent = labels[risk];
  }
  riskBadge.className = `risk-badge ${risk}`;
  scoreProgress.classList.remove('low', 'medium', 'high', 'critical');
  scoreProgress.classList.add(risk);
}

function showState(state: 'loading' | 'no-product' | 'results' | 'error'): void {
  loadingState.classList.add('hidden');
  noProductState.classList.add('hidden');
  resultsState.classList.add('hidden');
  errorState.classList.add('hidden');

  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'no-product':
      noProductState.classList.remove('hidden');
      break;
    case 'results':
      resultsState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
  }
}

function showError(message: string): void {
  errorMessage.textContent = message;
  showState('error');
}

async function handleAnalyze(): Promise<void> {
  if (currentProduct) {
    await analyzeProduct(currentProduct);
  }
}

async function handleRetry(): Promise<void> {
  await loadProductData();
}

function formatPrice(price: number, currency: Currency): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

init();
