import { getExtractor } from './extractors';
import type { IProductData, IExtensionMessage, IAnalysisResult } from '@shared/types/index';
import { RiskLevel } from '@shared/types/index';

let currentProductData: IProductData | null = null;

function init(): void {
  console.log('[NoHype] Content script loaded on:', window.location.href);
  extractProductData();
  chrome.runtime.onMessage.addListener(handleMessage);
  observeDOMChanges();
}

function extractProductData(): void {
  const url = window.location.href;
  const extractor = getExtractor(url);

  if (!extractor) {
    console.log('[NoHype] No extractor found for this site');
    return;
  }

  if (!extractor.isProductPage()) {
    console.log('[NoHype] Not a product page');
    return;
  }

  setTimeout(() => {
    currentProductData = extractor.extract();
    
    if (currentProductData) {
      console.log('[NoHype] Product data extracted:', currentProductData.name);
      notifyBackgroundScript();
    } else {
      console.log('[NoHype] Could not extract product data');
    }
  }, 1000);
}

function notifyBackgroundScript(): void {
  if (!currentProductData) return;

  chrome.runtime.sendMessage({
    type: 'PRODUCT_DATA',
    payload: currentProductData,
  });
}

function handleMessage(
  message: IExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  console.log('[NoHype] Content script received message:', message.type);

  switch (message.type) {
    case 'GET_PRODUCT_DATA':
      if (!currentProductData) {
        extractProductData();
        setTimeout(() => {
          sendResponse({ success: true, data: currentProductData });
        }, 1500);
      } else {
        sendResponse({ success: true, data: currentProductData });
      }
      return true;

    case 'ANALYSIS_RESULT':
      displayAnalysisResult(message.payload as IAnalysisResult);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return false;
}

function displayAnalysisResult(result: IAnalysisResult): void {
  const existingWidget = document.getElementById('nohype-widget');
  if (existingWidget) {
    existingWidget.remove();
  }

  const widget = createWidget(result);
  document.body.appendChild(widget);

  setTimeout(() => {
    widget.classList.add('nohype-visible');
  }, 100);
}

function createWidget(result: IAnalysisResult): HTMLElement {
  const widget = document.createElement('div');
  widget.id = 'nohype-widget';
  widget.className = 'nohype-widget';

  const riskColors: Record<RiskLevel, string> = {
    [RiskLevel.Low]: '#22c55e',
    [RiskLevel.Medium]: '#f59e0b',
    [RiskLevel.High]: '#f97316',
    [RiskLevel.Critical]: '#ef4444',
  };

  const riskLabels: Record<RiskLevel, string> = {
    [RiskLevel.Low]: 'Low risk',
    [RiskLevel.Medium]: 'Medium risk',
    [RiskLevel.High]: 'High risk',
    [RiskLevel.Critical]: 'Warning!',
  };

  widget.innerHTML = `
    <div class="nohype-header">
      <span class="nohype-logo">🔍 NoHype</span>
      <button class="nohype-close" id="nohype-close">×</button>
    </div>
    <div class="nohype-content">
      <div class="nohype-score" style="--score-color: ${riskColors[result.riskLevel]}">
        <div class="nohype-score-value">${result.hypeScore}</div>
        <div class="nohype-score-label">Hype Score</div>
      </div>
      <div class="nohype-risk" style="color: ${riskColors[result.riskLevel]}">
        ${riskLabels[result.riskLevel]}
      </div>
      <p class="nohype-summary">${result.summary}</p>
      ${result.flags.length > 0 ? `
        <div class="nohype-flags">
          ${result.flags.map((flag) => `
            <div class="nohype-flag nohype-flag-${flag.severity}">
              ⚠️ ${flag.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${result.buzzwords.length > 0 ? `
        <div class="nohype-buzzwords">
          <strong>Buzzwords:</strong>
          ${result.buzzwords.slice(0, 5).map((b) => `
            <span class="nohype-buzzword">${b.word}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  widget.querySelector('#nohype-close')?.addEventListener('click', () => {
    widget.classList.remove('nohype-visible');
    setTimeout(() => widget.remove(), 300);
  });

  return widget;
}

function observeDOMChanges(): void {
  let lastUrl = window.location.href;

  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[NoHype] URL changed, re-extracting...');
      currentProductData = null;
      extractProductData();
    }
  }, 1000);
}

init();
