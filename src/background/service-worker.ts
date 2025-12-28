import { apiClient } from '@shared/api-client';
import type { 
  IExtensionMessage, 
  IProductData, 
  IAnalysisResult,
  IStorageData,
  IUserSettings,
} from '@shared/types/index';
import { DEFAULT_SETTINGS, CACHE_TTL } from '@shared/constants';

const analysisCache = new Map<string, { result: IAnalysisResult; timestamp: number }>();

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  console.log('[NoHype] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    await initializeStorage();
  }
});

async function initializeStorage(): Promise<void> {
  const defaultData: IStorageData = {
    settings: DEFAULT_SETTINGS as IUserSettings,
    cache: {},
    history: [],
  };

  await chrome.storage.local.set(defaultData);
  console.log('[NoHype] Storage initialized with defaults');
}

chrome.runtime.onMessage.addListener((
  message: IExtensionMessage, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response: unknown) => void
) => {
  console.log('[NoHype] Background received:', message.type);
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(
  message: IExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    switch (message.type) {
      case 'PRODUCT_DATA':
        console.log('[NoHype] Received product data from content script');
        sendResponse({ success: true });
        break;

      case 'ANALYZE_PRODUCT':
        const productData = message.payload as IProductData;
        const result = await analyzeProduct(productData);
        
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'ANALYSIS_RESULT',
            payload: result,
          });
        }
        
        sendResponse({ success: true, data: result });
        break;

      case 'GET_PRODUCT_DATA':
        const data = await getProductDataFromActiveTab();
        sendResponse({ success: true, data });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[NoHype] Error handling message:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function analyzeProduct(product: IProductData): Promise<IAnalysisResult> {
  const cacheKey = generateCacheKey(product.url);

  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[NoHype] Returning cached analysis');
    return cached.result;
  }

  const storageData = await chrome.storage.local.get('cache');
  const storedCache = storageData.cache as Record<string, IAnalysisResult> || {};
  
  if (storedCache[cacheKey]) {
    const storedResult = storedCache[cacheKey];
    if (Date.now() - storedResult.analyzedAt < CACHE_TTL) {
      console.log('[NoHype] Returning storage cached analysis');
      analysisCache.set(cacheKey, { result: storedResult, timestamp: storedResult.analyzedAt });
      return storedResult;
    }
  }

  console.log('[NoHype] Requesting analysis from API...');
  const result = await apiClient.analyzeProduct(product);

  analysisCache.set(cacheKey, { result, timestamp: Date.now() });
  
  storedCache[cacheKey] = result;
  await chrome.storage.local.set({ cache: storedCache });

  await addToHistory(product, result);

  return result;
}

async function getProductDataFromActiveTab(): Promise<IProductData | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tab.id!,
      { type: 'GET_PRODUCT_DATA', payload: null },
      (response: { success: boolean; data?: IProductData }) => {
        if (chrome.runtime.lastError) {
          console.warn('[NoHype] Error getting product data:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response?.data || null);
        }
      }
    );
  });
}

async function addToHistory(product: IProductData, result: IAnalysisResult): Promise<void> {
  const storageData = await chrome.storage.local.get('history');
  const history = storageData.history || [];

  history.unshift({
    url: product.url,
    productName: product.name,
    hypeScore: result.hypeScore,
    date: new Date().toISOString(),
  });

  if (history.length > 100) {
    history.splice(100);
  }

  await chrome.storage.local.set({ history });
}

function generateCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.search = '';
    return urlObj.href;
  } catch {
    return url;
  }
}

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_CURRENT' });
  }
});

console.log('[NoHype] Service Worker started');
