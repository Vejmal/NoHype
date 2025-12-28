# 🔍 NoHype - Wykrywacz Przesady

> Chrome Extension do wykrywania przesadzonych opisów produktów, fałszywych rabatów i podejrzanych recenzji.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

## ✨ Funkcje

- 🎯 **Hype Score** - Ocena poziomu "hype" produktu (0-100)
- 🏷️ **Wykrywanie buzzwordów** - Identyfikacja przesadzonych słów marketingowych
- 💰 **Analiza cen** - Wykrywanie fałszywych rabatów
- ⭐ **Analiza recenzji** - Sprawdzanie autentyczności opinii
- 🔄 **Alternatywy** - Sugestie tańszych/lepszych produktów

## 🛒 Obsługiwane sklepy

- Amazon (.com, .pl, .de, .co.uk)
- Allegro
- AliExpress
- Ceneo
- Sephora
- Zalando

## 🚀 Instalacja (Developer Mode)

### Wymagania
- Node.js 18+
- npm lub yarn

### Kroki

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/Vejmal/NoHype.git
   cd NoHype
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   ```

3. **Zbuduj rozszerzenie**
   ```bash
   npm run build
   ```

4. **Załaduj w Chrome**
   - Otwórz `chrome://extensions`
   - Włącz "Tryb dewelopera" (prawy górny róg)
   - Kliknij "Załaduj rozpakowane"
   - Wybierz folder `dist`

### Development mode (z auto-reload)

```bash
npm run dev
```

## 📁 Struktura projektu

```
NoHype/
├── public/
│   ├── manifest.json      # Konfiguracja rozszerzenia (Manifest V3)
│   └── icons/             # Ikony aplikacji
├── src/
│   ├── background/        # Service Worker
│   │   └── service-worker.ts
│   ├── content/           # Content Scripts
│   │   ├── content.ts
│   │   ├── content.css
│   │   └── extractors/    # Ekstraktory dla każdego sklepu
│   │       ├── amazon-extractor.ts
│   │       ├── allegro-extractor.ts
│   │       └── aliexpress-extractor.ts
│   ├── popup/             # Popup UI
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── shared/            # Współdzielone typy i utilities
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── api-client.ts
│   └── utils/             # Funkcje pomocnicze
│       └── helpers.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Skrypty

| Komenda | Opis |
|---------|------|
| `npm run dev` | Build w trybie watch (development) |
| `npm run build` | Produkcyjny build |
| `npm run type-check` | Sprawdzenie typów TypeScript |

## 🛠️ Technologie

- **TypeScript** - Typowany JavaScript
- **Vite** - Bundler z HMR
- **@crxjs/vite-plugin** - Plugin Vite dla Chrome Extensions
- **Manifest V3** - Najnowszy standard rozszerzeń Chrome

## 📋 TODO

### ✅ Zaimplementowane
- [x] **Hype Score** - ocena poziomu "hype" produktu (0-100) z progami Low/Medium/High/Critical
- [x] **Wykrywanie buzzwordów** - identyfikacja marketingowych słów kluczowych
- [x] **Ekstraktory**: Amazon, Allegro, AliExpress (z obsługą JSON-LD)
- [x] **Quick Score Badge** - widget na stronie produktu po analizie
- [x] **Historia analiz** - przeglądanie poprzednich analiz w popup
- [x] **Panel ustawień** - konfiguracja rozszerzenia (auto-analiza, powiadomienia, widget)
- [x] **Podstawowe wykrywanie rabatów** - flagi dla dużych promocji (>50%, >70%)
- [x] **🔔 Alarm cenowy** - ustawianie ceny docelowej, powiadomienia Chrome, lista alarmów
- [x] **Minimalistyczny UI** - dark theme, animowane score'y, toast notifications
- [x] **Cache analiz** - unikanie powtórnych zapytań
- [x] **TypeScript strict mode** - pełne typowanie z izolowanymi modułami

### ⚠️ Częściowo zaimplementowane
- [ ] Wykrywanie fałszywych promocji (brak API do weryfikacji historii cen)
- [ ] Analiza autentyczności recenzji (mock data - potrzebne NLP)
- [ ] Alternatywy produktów (interface gotowy, brak rzeczywistych danych)

### 📌 Do zrobienia - Wysoki priorytet
- [ ] 🔍 **Porównywarka cen** - linki do Ceneo/Google Shopping z nazwą produktu
- [ ] 📈 **Wykres historii cen** - integracja z Keepa API lub scraping Ceneo
- [ ] 🤖 **Backend API** - FastAPI/Python z prawdziwym NLP (OpenAI/Claude)
- [ ] 🧪 **Testy jednostkowe** - Vitest dla ekstraktorów i logiki

### 📌 Do zrobienia - Średni priorytet  
- [ ] 🏪 **Więcej sklepów** - Temu, Shein, Empik, MediaMarkt, OLX
- [ ] 🌐 **i18n** - wsparcie dla EN/DE oprócz PL
- [ ] 📊 **Statystyki użytkownika** - ile zaoszczędził, ile produktów przeanalizował
- [ ] 🎨 **Motywy** - light/dark/auto

### 📌 Do zrobienia - Niski priorytet
- [ ] 🦊 **Firefox addon** - port na Manifest V2
- [ ] 📱 **Mobile friendly popup** - responsive design
- [ ] 🔗 **Eksport danych** - CSV z historią analiz
- [ ] 🏷️ **Tagowanie produktów** - własne kategorie/listy

## 🔒 Prywatność

NoHype **nie zbiera** danych osobowych użytkowników. Rozszerzenie analizuje tylko:
- Opisy produktów
- Ceny
- Recenzje (publicznie dostępne)

Dane są przetwarzane lokalnie lub wysyłane do API NoHype wyłącznie w celu analizy.

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE)

## 🤝 Współpraca

Pull requesty są mile widziane! Przed większymi zmianami proszę o utworzenie Issue.

---

Made with ❤️ by NoHype Team
