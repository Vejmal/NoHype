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

- [ ] Backend API (FastAPI/Python)
- [ ] Prawdziwa analiza NLP
- [ ] Historia cen (integracja z Keepa)
- [ ] Więcej sklepów (Temu, Shein, Empik)
- [ ] Wersja Firefox
- [ ] Testy jednostkowe

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
