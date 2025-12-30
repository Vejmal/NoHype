import type { IProductData, IAnalysisResult, IHypeFlag, IPriceAlert } from '../shared/types/index';
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

const priceAlertBtn = document.getElementById('price-alert-btn')!;
const priceAlertModal = document.getElementById('price-alert-modal')!;
const priceAlertClose = document.getElementById('price-alert-close')!;
const priceAlertCancel = document.getElementById('price-alert-cancel')!;
const priceAlertSave = document.getElementById('price-alert-save')!;
const targetPriceInput = document.getElementById('target-price') as HTMLInputElement;
const modalCurrentPrice = document.getElementById('modal-current-price')!;
const modalCurrency = document.getElementById('modal-currency')!;
const priceAlertBtnText = document.getElementById('price-alert-btn-text')!;

const compareSection = document.getElementById('price-compare-section')!;
const compareToggle = document.getElementById('compare-toggle')!;
const compareLinks = document.getElementById('compare-links')!;
const compareCeneo = document.getElementById('compare-ceneo') as HTMLAnchorElement;
const compareGoogle = document.getElementById('compare-google') as HTMLAnchorElement;
const compareAllegro = document.getElementById('compare-allegro') as HTMLAnchorElement;
const compareAmazon = document.getElementById('compare-amazon') as HTMLAnchorElement;

let currentProduct: IProductData | null = null;
let currentAnalysis: IAnalysisResult | null = null;
let currentPriceAlert: IPriceAlert | null = null;

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
  initHistoryActions();
  initPriceAlert();
  initPriceComparison();

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
      
      if (tabId === 'history') {
        loadHistory();
      }
      if (tabId === 'alerts') {
        loadAlerts();
      }
    });
  });
  
  updateAlertsCount();
}

interface HistoryItem {
  url: string;
  productName: string;
  hypeScore: number;
  date: string;
}

async function loadHistory(): Promise<void> {
  const historyList = document.getElementById('history-list')!;
  const historyCount = document.getElementById('history-count')!;
  
  const storageData = await chrome.storage.local.get('history');
  const history: HistoryItem[] = storageData.history || [];
  
  historyCount.textContent = `${history.length} ${getAnalysisWord(history.length)}`;
  
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-message">Brak historii analiz</p>';
    return;
  }
  
  historyList.innerHTML = history.map(item => renderHistoryItem(item)).join('');
}

function getAnalysisWord(count: number): string {
  if (count === 1) return 'analiza';
  if (count >= 2 && count <= 4) return 'analizy';
  return 'analiz';
}

function renderHistoryItem(item: HistoryItem): string {
  const scoreClass = item.hypeScore <= 40 ? 'low' : item.hypeScore <= 60 ? 'medium' : 'high';
  const source = getSourceFromUrl(item.url);
  const timeAgo = getTimeAgo(item.date);
  
  return `
    <a href="${item.url}" target="_blank" class="history-item" title="${item.productName}">
      <div class="history-score ${scoreClass}">${item.hypeScore}</div>
      <div class="history-info">
        <div class="history-name">${escapeHtml(item.productName)}</div>
        <div class="history-meta">
          <span class="history-source">${source}</span>
          <span>•</span>
          <span>${timeAgo}</span>
        </div>
      </div>
      <div class="history-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </a>
  `;
}

function getSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('amazon')) return 'Amazon';
    if (hostname.includes('allegro')) return 'Allegro';
    if (hostname.includes('aliexpress')) return 'AliExpress';
    return hostname.replace('www.', '');
  } catch {
    return 'Nieznane';
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'przed chwilą';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;
  
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ history: [] });
  loadHistory();
}

function initHistoryActions(): void {
  const clearBtn = document.getElementById('history-clear-btn');
  clearBtn?.addEventListener('click', async () => {
    if (confirm('Czy na pewno chcesz wyczyścić historię analiz?')) {
      await clearHistory();
    }
  });
}

async function loadAlerts(): Promise<void> {
  const alertsList = document.getElementById('alerts-list')!;
  
  const storageData = await chrome.storage.local.get('priceAlerts');
  const alerts: IPriceAlert[] = (storageData.priceAlerts || []).filter((a: IPriceAlert) => a.isActive);
  
  updateAlertsCount();
  
  if (alerts.length === 0) {
    alertsList.innerHTML = '<p class="empty-message">Brak aktywnych alarmów</p>';
    return;
  }
  
  alertsList.innerHTML = alerts.map(alert => renderAlertItem(alert)).join('');
  
  alertsList.querySelectorAll('.alert-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const alertId = (btn as HTMLElement).dataset.alertId;
      if (alertId) {
        await removeAlert(alertId);
      }
    });
  });
}

function renderAlertItem(alert: IPriceAlert): string {
  const currency = getCurrencySymbol(alert.currency);
  const isTriggered = alert.currentPrice <= alert.targetPrice;
  
  return `
    <div class="alert-item ${isTriggered ? 'triggered' : ''}" data-url="${alert.productUrl}">
      <div class="alert-icon">${isTriggered ? '✓' : '🔔'}</div>
      <div class="alert-info">
        <div class="alert-name" title="${escapeHtml(alert.productName)}">${escapeHtml(alert.productName)}</div>
        <div class="alert-prices">
          <span class="alert-current-price">${alert.currentPrice.toFixed(2)} ${currency}</span>
          <span>→</span>
          <span class="alert-target-price">${alert.targetPrice.toFixed(2)} ${currency}</span>
        </div>
      </div>
      <button class="alert-remove" data-alert-id="${alert.id}" title="Usuń alarm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
}

async function removeAlert(alertId: string): Promise<void> {
  const storageData = await chrome.storage.local.get('priceAlerts');
  const alerts: IPriceAlert[] = storageData.priceAlerts || [];
  
  const updatedAlerts = alerts.filter(a => a.id !== alertId);
  await chrome.storage.local.set({ priceAlerts: updatedAlerts });
  
  if (currentPriceAlert?.id === alertId) {
    currentPriceAlert = null;
    updatePriceAlertButton(false);
  }
  
  loadAlerts();
  showToast('Alarm usunięty');
}

async function updateAlertsCount(): Promise<void> {
  const alertsCountEl = document.getElementById('alerts-count');
  if (!alertsCountEl) return;
  
  const storageData = await chrome.storage.local.get('priceAlerts');
  const alerts: IPriceAlert[] = (storageData.priceAlerts || []).filter((a: IPriceAlert) => a.isActive);
  
  alertsCountEl.textContent = alerts.length.toString();
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
  updatePriceComparison(product.name, product.url);

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

function getRiskLevelFromScore(score: number): RiskLevel {
  if (score <= 40) return RiskLevel.Low;
  if (score <= 60) return RiskLevel.Medium;
  if (score <= 80) return RiskLevel.High;
  return RiskLevel.Critical;
}

function getScoreColor(score: number): string {
  switch (getRiskLevelFromScore(score)) {
    case RiskLevel.Low:
      return '#22c55e';
    case RiskLevel.Medium:
      return '#f59e0b';
    case RiskLevel.High:
      return '#f97316';
    case RiskLevel.Critical:
      return '#ef4444';
  }
}

function getScoreClass(score: number): string {
  return getRiskLevelFromScore(score);
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

function initPriceAlert(): void {
  priceAlertBtn.addEventListener('click', openPriceAlertModal);
  priceAlertClose.addEventListener('click', closePriceAlertModal);
  priceAlertCancel.addEventListener('click', closePriceAlertModal);
  priceAlertSave.addEventListener('click', savePriceAlert);
  
  targetPriceInput.addEventListener('input', validateTargetPrice);
  
  priceAlertModal.addEventListener('click', (e) => {
    if (e.target === priceAlertModal) {
      closePriceAlertModal();
    }
  });
}

async function openPriceAlertModal(): Promise<void> {
  if (!currentProduct) return;
  
  await checkExistingAlert();
  
  const price = currentProduct.price || 0;
  const currency = getCurrencySymbol(currentProduct.currency || Currency.PLN);
  
  modalCurrentPrice.textContent = `${price.toFixed(2)} ${currency}`;
  modalCurrency.textContent = currency;
  
  if (currentPriceAlert) {
    targetPriceInput.value = currentPriceAlert.targetPrice.toString();
  } else {
    const suggestedPrice = Math.floor(price * 0.9);
    targetPriceInput.value = suggestedPrice.toString();
  }
  
  validateTargetPrice();
  priceAlertModal.classList.remove('hidden');
}

function closePriceAlertModal(): void {
  priceAlertModal.classList.add('hidden');
}

function validateTargetPrice(): void {
  const targetPrice = parseFloat(targetPriceInput.value);
  const currentPrice = currentProduct?.price || 0;
  
  const isValid = !isNaN(targetPrice) && targetPrice > 0 && targetPrice < currentPrice;
  (priceAlertSave as HTMLButtonElement).disabled = !isValid;
}

async function savePriceAlert(): Promise<void> {
  if (!currentProduct) return;
  
  const targetPrice = parseFloat(targetPriceInput.value);
  if (isNaN(targetPrice) || targetPrice <= 0) return;
  
  const alert: IPriceAlert = {
    id: generateAlertId(),
    productUrl: currentProduct.url,
    productName: currentProduct.name,
    currentPrice: currentProduct.price || 0,
    targetPrice,
    currency: currentProduct.currency || Currency.PLN,
    createdAt: Date.now(),
    source: getSourceFromUrl(currentProduct.url),
    isActive: true,
  };
  
  await saveAlertToStorage(alert);
  currentPriceAlert = alert;
  
  updatePriceAlertButton(true);
  closePriceAlertModal();
  
  showToast(`Alarm ustawiony na ${targetPrice.toFixed(2)} ${getCurrencySymbol(alert.currency)}`);
}

async function checkExistingAlert(): Promise<void> {
  if (!currentProduct) return;
  
  const storageData = await chrome.storage.local.get('priceAlerts');
  const alerts: IPriceAlert[] = storageData.priceAlerts || [];
  
  currentPriceAlert = alerts.find(
    a => a.productUrl === currentProduct!.url && a.isActive
  ) || null;
  
  updatePriceAlertButton(!!currentPriceAlert);
}

function updatePriceAlertButton(hasAlert: boolean): void {
  if (hasAlert && currentPriceAlert) {
    priceAlertBtn.classList.add('active');
    const currency = getCurrencySymbol(currentPriceAlert.currency);
    priceAlertBtnText.textContent = `Alarm: ${currentPriceAlert.targetPrice.toFixed(2)} ${currency}`;
  } else {
    priceAlertBtn.classList.remove('active');
    priceAlertBtnText.textContent = 'Ustaw alarm cenowy';
  }
}

async function saveAlertToStorage(alert: IPriceAlert): Promise<void> {
  const storageData = await chrome.storage.local.get('priceAlerts');
  const alerts: IPriceAlert[] = storageData.priceAlerts || [];
  
  const existingIndex = alerts.findIndex(a => a.productUrl === alert.productUrl);
  if (existingIndex >= 0) {
    alerts[existingIndex] = alert;
  } else {
    alerts.unshift(alert);
  }
  
  if (alerts.length > 50) {
    alerts.splice(50);
  }
  
  await chrome.storage.local.set({ priceAlerts: alerts });
}

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    PLN: 'zł',
    EUR: '€',
    USD: '$',
    GBP: '£',
  };
  return symbols[currency] || currency;
}

function showToast(message: string): void {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('visible'), 10);
  
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function initPriceComparison(): void {
  const sectionHeader = compareSection.querySelector('.section-header');
  sectionHeader?.addEventListener('click', toggleCompareSection);
  compareToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCompareSection();
  });
}

function toggleCompareSection(): void {
  compareToggle.classList.toggle('collapsed');
  compareLinks.classList.toggle('collapsed');
}

function updatePriceComparison(productName: string, currentUrl: string): void {
  const searchQuery = encodeURIComponent(cleanProductName(productName));
  const currentSource = getSourceFromUrl(currentUrl).toLowerCase();
  
  compareCeneo.href = `https://www.ceneo.pl/szukaj-${searchQuery}`;
  compareGoogle.href = `https://www.google.com/search?tbm=shop&q=${searchQuery}`;
  compareAllegro.href = `https://allegro.pl/listing?string=${searchQuery}`;
  compareAmazon.href = `https://www.amazon.pl/s?k=${searchQuery}`;
  
  compareCeneo.classList.toggle('hidden', currentSource === 'ceneo');
  compareAllegro.classList.toggle('hidden', currentSource === 'allegro');
  compareAmazon.classList.toggle('hidden', currentSource === 'amazon');
  compareGoogle.classList.remove('hidden');
  
  compareSection.style.display = 'block';
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s*[-–—|]\s*[^-–—|]*$/g, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 80);
}

init();
