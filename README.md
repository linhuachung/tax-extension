# Gmail VAT Invoice Intelligence Extension (Phase 1)

Production-grade Chrome Extension foundation (Manifest v3) with:

- MV3 **background service worker** as the core engine (single source of truth)
- **Gmail OAuth** via `chrome.identity`
- Gmail **profile fetch** via Gmail API
- Typed Popup ↔ Background messaging (Zod-validated)

## Tech stack

- Vite + React + TypeScript
- CRXJS (`@crxjs/vite-plugin`)
- Zustand (background store)
- Zod (schemas + validation)

## 1) Google OAuth + Gmail API setup

You must provide your own Google OAuth client id (Chrome Extension client type).

If you don’t have an Extension ID yet, first run a build and **Load unpacked** `dist/` (even with the placeholder client id) to obtain the Extension ID from `chrome://extensions`, then come back here.

1. Create or choose a Google Cloud project.
2. Enable **Gmail API** for the project.
3. Configure the **OAuth consent screen**.
4. Create OAuth credentials:
   - **Application type**: **Chrome extension**
   - **Extension ID**: use the ID shown in `chrome://extensions` after you load the extension (next section).
5. Copy the generated **Client ID** and paste it into:
   - `manifest.json` → `oauth2.client_id`

Required scope (already in `manifest.json`):

- `https://www.googleapis.com/auth/gmail.readonly`

## 2) Install + build

```bash
npm install
npm run build
```

Build output is written to `dist/`.

## 3) Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder in this project

If you change `manifest.json` (e.g. OAuth client id), re-run `npm run build` and click **Reload** on the extension card in `chrome://extensions`.

## 4) Test flow (Phase 1)

1. Click the extension icon to open the Popup.
2. Click **Login**:
   - Chrome should open an OAuth consent flow.
3. After successful login, the Popup should show:
   - Account (email)
   - Gmail profile metrics (messages, threads, historyId)
4. Click **Refresh Profile** to re-fetch `users/me/profile`.
5. Click **Logout** to clear the cached auth token (and best-effort revoke).

## Environment configuration

Copy `.env.example` to `.env` to override runtime settings:

- `VITE_LOG_LEVEL` (`debug` | `info` | `warn` | `error` | `silent`)
- `VITE_APP_PHASE` (defaults to `phase1`)
- `VITE_GMAIL_API_BASE_URL` (optional)

## Architecture rules (enforced)

- **Background owns business state** (in-memory + `chrome.storage.local`)
- **Popup is a thin client** that only talks to Background via runtime messaging
- **No content scripts** in Phase 1

## Project docs

See `phase1.md` for Phase 1 architecture decisions, contracts, storage schema, and limitations.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
