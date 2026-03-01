# Phase 1 — Foundation Architecture

## Objective

Build a scalable, production-ready **Chrome Extension (Manifest v3)** foundation for “Gmail VAT Invoice Intelligence” with:

- Background **service worker** as the core engine and single source of truth
- **Gmail OAuth** via `chrome.identity`
- Token/session persistence strategy
- Gmail **profile fetch** via Gmail API
- Typed, validated **message contracts** between Popup ↔ Background
- Structured logger with **phase tracking**
- Environment configuration system
- Clean folder structure ready for Phase 2 scanning + extraction pipelines

## Architecture decisions

- **Manifest v3 + Service Worker core**
  - All business logic runs in `src/background/`.
  - Popup is a thin UI client; it never performs business logic or writes business state directly.
  - No content scripts in Phase 1 (and none planned unless future Gmail DOM augmentation is explicitly required).

- **State management**
  - Background owns business state using a **Zustand vanilla store** (in-memory) with a **persisted subset** in `chrome.storage.local`.
  - Popup maintains only UI state + cached view models; authoritative state lives in Background.

- **Messaging (Popup ↔ Background)**
  - A single, centralized runtime message handler routes requests.
  - All messages are validated with **Zod** at the boundary.
  - Request/response envelopes include `type`, `requestId`, and typed payloads; errors use a structured error contract.
  - Responses always include a **safe state snapshot**: `data: { state }` (when `ok: true`).

- **Gmail API access**
  - OAuth tokens are obtained via `chrome.identity`.
  - All Gmail calls go through a centralized API wrapper that injects `Authorization: Bearer <token>` and implements minimal retry-on-401 behavior.
  - Logout performs best-effort revocation via `oauth2.googleapis.com` in addition to cache removal.

- **Logging**
  - Structured logger emits JSON-like records with `level`, `phase`, `module`, and optional context.
  - Log verbosity is controlled via environment config.

- **Environment configuration**
  - Runtime env is loaded from `import.meta.env` and validated with Zod.
  - Build-time values required by the manifest (notably OAuth client id) are documented and kept explicit.
  - Implemented variables:
    - `VITE_APP_PHASE` (default `phase1`)
    - `VITE_LOG_LEVEL` (`debug` | `info` | `warn` | `error` | `silent`)
    - `VITE_GMAIL_API_BASE_URL` (default `https://www.googleapis.com/gmail/v1`)

- **Storage schema**
  - Persisted key: `taxintel.persist.v1` in `chrome.storage.local`
  - Stored fields: stable auth status + last-known email, plus last fetched Gmail profile (small, bounded payload)
  - Schema versioning is included to support future migrations.

## Folder structure changes

Target structure for Phase 1:

```
/src
  /background
    /auth
    /gmail
    /storage
    /logger
    index.ts
  /popup
  /shared
    /types
    /schemas
    /utils
  /services
manifest.json
vite.config.ts
```

Phase 1 will migrate from the default Vite template (`src/main.tsx`, `src/App.tsx`) into `src/popup/` and introduce the background engine under `src/background/`.
The default template files are removed after migration; `index.html` is repointed to the popup UI for local preview.

## Libraries added (Phase 1)

- **`@crxjs/vite-plugin`**: MV3 extension build + dev workflow on Vite
- **`zustand`**: background in-memory store (vanilla) + optional UI stores
- **`zod`**: schema validation for env, message contracts, storage payloads, API responses
- **`@types/chrome`**: Chrome Extensions API typings

Security note:

- `package.json` uses an `overrides` entry to pin `@crxjs/vite-plugin`’s internal `rollup` dependency to a patched v2 release (prevents known path traversal advisories).

## Data flow design

1. **Popup UI** triggers an intent (Login, Logout, Get Profile).
2. Popup sends a **typed message** to Background via `chrome.runtime.sendMessage`.
3. Background router validates the request and delegates to:
   - Auth module (token retrieval / revoke)
   - Gmail module (API wrapper + endpoints)
   - Storage module (persisted state updates)
4. Background updates in-memory store and persists the minimal required subset.
5. Background returns a typed response; Popup renders the result.

## State machine updates

### Auth session state (Background-owned)

States:

- `signed_out`
- `signing_in`
- `signed_in`
- `signing_out`
- `error`

Transitions (high level):

- `signed_out` → `signing_in` → `signed_in`
- `signed_in` → `signing_out` → `signed_out`
- Any → `error` (with recoverable actions: retry login, logout/reset session)

Persisted fields include the auth status and last-known account metadata; sensitive token handling is centralized in the Auth module.

## API contracts

### Runtime messaging envelope (Popup ↔ Background)

- **Request**
  - `requestId`: string
  - `type`: `auth.login` | `auth.logout` | `gmail.getProfile` | `app.getState`
  - `payload`: object (validated per `type`)

- **Response**
  - `requestId`: string
  - `type`: same as request `type`
  - `ok`: boolean
  - `data` (when `ok: true`): `{ state }`
  - `error` (when `ok: false`): `{ code, message, details? }`

### Phase 1 message types (planned)

- `auth.login` → obtain OAuth token interactively
- `auth.logout` → revoke cached token and clear session
- `gmail.getProfile` → fetch Gmail profile for `me`
- `app.getState` → return Background-owned view state (safe subset)

## Known limitations (Phase 1)

- Only **Gmail profile** endpoint is implemented (no inbox scanning yet).
- No multi-account switching UX in Popup (single active auth session).
- Token lifecycle uses `chrome.identity` caching; fine-grained expiry metadata is not guaranteed.
- OAuth client id must be provided in `manifest.json` (placeholder is not functional).
- Background boot restores session silently but does **not** auto-fetch profile to avoid unexpected network work.
- No backend/SaaS sync in Phase 1 (explicitly deferred to later phases).

## Future improvement notes

- Add incremental scanning pipeline (historyId-based) with async queues and backpressure.
- Add invoice attachment discovery (PDF/XML), download, local XML parse, and Gemini extraction.
- Add richer storage schema + export formats (CSV/XLSX) and analytics dashboard.
- Add robust observability: persisted logs, trace IDs, and failure analytics.

=====================================================================
PHASE 1 – ENTERPRISE CODE QUALITY FOUNDATION (SUPER COMPLETE)
=====================================================================

IMPORTANT:

- DO NOT create additional markdown files.
- Append this entire section at the END of phase1.md.
- Do not summarize configurations.
- Execute steps in exact order.
- Phase 1 is NOT complete unless all validation checks pass.

=====================================================================
OBJECTIVE
=====================================================================

Transform the repository into a BigTech-grade, production-ready, enterprise-scale codebase.

This foundation guarantees:

✔ Strict TypeScript enforcement  
✔ Explicit spacing style: ( x ) { x } ( ( x ) )  
✔ Zero unused imports  
✔ Deterministic import sorting  
✔ Safe async handling  
✔ Strict boolean evaluation  
✔ Controlled complexity  
✔ Clean React architecture  
✔ Architectural boundaries  
✔ Auto lint + auto format on save  
✔ Pre-commit enforcement  
✔ Conventional commit enforcement  
✔ CI-ready structure  
✔ Zero ESLint errors allowed

=====================================================================
STEP 0 – SYSTEM PRE-CHECK
=====================================================================

Verify:

node -v >= 18  
npm -v >= 9

tsconfig.json must contain:

{
"compilerOptions": {
"strict": true,
"noImplicitAny": true,
"noUncheckedIndexedAccess": true,
"noFallthroughCasesInSwitch": true
}
}

If not enabled → enable immediately.

=====================================================================
STEP 1 – INSTALL ALL DEPENDENCIES
=====================================================================

Run:

npm install -D \
eslint @eslint/js typescript-eslint \
@typescript-eslint/parser @typescript-eslint/eslint-plugin \
eslint-plugin-react eslint-plugin-react-hooks \
eslint-plugin-import eslint-plugin-unused-imports \
eslint-plugin-simple-import-sort eslint-plugin-boundaries \
eslint-plugin-sonarjs eslint-config-prettier prettier \
husky lint-staged commitlint @commitlint/config-conventional

Do not skip any dependency.

=====================================================================
STEP 2 – CREATE ESLINT FLAT CONFIG
=====================================================================

Create file:

eslint.config.js

Paste EXACTLY:

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import unusedImports from 'eslint-plugin-unused-imports'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import boundaries from 'eslint-plugin-boundaries'
import sonarjs from 'eslint-plugin-sonarjs'
import prettier from 'eslint-config-prettier'

export default [
js.configs.recommended,
...tseslint.configs.recommended,
{
files: [ '**/*.{ts,tsx}' ],
languageOptions: {
parser: tseslint.parser,
parserOptions: {
project: './tsconfig.json'
}
},
plugins: {
react: reactPlugin,
'react-hooks': reactHooks,
import: importPlugin,
'unused-imports': unusedImports,
'simple-import-sort': simpleImportSort,
boundaries,
sonarjs
},
settings: {
react: {
version: 'detect'
}
},
rules: {

      /* ======================
         SPACING POLICY
      ====================== */

      'space-in-parens': [ 'error', 'always' ],
      'object-curly-spacing': [ 'error', 'always' ],
      'array-bracket-spacing': [ 'error', 'always' ],
      'computed-property-spacing': [ 'error', 'always' ],
      'space-before-function-paren': [ 'error', 'always' ],
      'space-before-blocks': [ 'error', 'always' ],
      'space-infix-ops': 'error',
      'arrow-parens': [ 'error', 'always' ],
      'keyword-spacing': 'error',
      'curly': [ 'error', 'all' ],
      'padded-blocks': [ 'error', 'never' ],
      'no-multiple-empty-lines': [ 'error', { max: 1 } ],
      'eol-last': [ 'error', 'always' ],

      /* ======================
         TYPESCRIPT STRICTNESS
      ====================== */

      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variableLike', format: [ 'camelCase' ] },
        { selector: 'typeLike', format: [ 'PascalCase' ] },
        { selector: 'enumMember', format: [ 'UPPER_CASE' ] }
      ],

      /* ======================
         REACT
      ====================== */

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': [ 'error', 'never' ],
      'react/jsx-fragments': [ 'error', 'syntax' ],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-key': 'error',
      'react/react-in-jsx-scope': 'off',

      /* ======================
         IMPORTS
      ====================== */

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-duplicate-imports': 'error',
      'unused-imports/no-unused-imports': 'error',

      /* ======================
         CLEAN CODE
      ====================== */

      'eqeqeq': [ 'error', 'always' ],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-implicit-coercion': 'error',
      'no-useless-return': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'func-style': [ 'error', 'expression' ],
      'prefer-arrow-callback': 'error',
      'arrow-body-style': [ 'error', 'as-needed' ],
      'no-await-in-loop': 'error',
      'require-atomic-updates': 'error',

      /* ======================
         COMPLEXITY CONTROL
      ====================== */

      'max-depth': [ 'error', 3 ],
      'max-params': [ 'error', 3 ],
      'max-lines-per-function': [ 'error', 50 ],
      'sonarjs/cognitive-complexity': [ 'error', 15 ]
    }

},
prettier
]

=====================================================================
STEP 3 – PRETTIER CONFIG
=====================================================================

Create:

.prettierrc

{
"semi": false,
"singleQuote": true,
"trailingComma": "all",
"tabWidth": 2,
"printWidth": 100,
"bracketSpacing": true,
"arrowParens": "always",
"endOfLine": "lf"
}

=====================================================================
STEP 4 – VSCODE SETTINGS
=====================================================================

Create:

.vscode/settings.json

{
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"editor.codeActionsOnSave": {
"source.fixAll.eslint": true
}
}

=====================================================================
STEP 5 – PACKAGE.JSON SCRIPTS
=====================================================================

Add:

"scripts": {
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"prepare": "husky install"
}

=====================================================================
STEP 6 – ENABLE HUSKY
=====================================================================

npx husky install

npx husky add .husky/pre-commit "npx lint-staged"

Add:

"lint-staged": {
"\*.{ts,tsx,js}": [
"eslint --fix",
"prettier --write"
]
}

=====================================================================
STEP 7 – ENABLE COMMITLINT
=====================================================================

Create:

commitlint.config.js

export default {
extends: [ '@commitlint/config-conventional' ]
}

npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"

=====================================================================
STEP 8 – VALIDATION CHECKLIST
=====================================================================

✔ npm run lint → zero errors  
✔ npm run lint:fix → clean  
✔ npm run format → consistent  
✔ Commit fails if lint error  
✔ Commit fails if invalid message  
✔ Spacing format enforced  
✔ No unused imports  
✔ Boolean must be explicit

=====================================================================
ACCEPTANCE CONDITION
=====================================================================

Phase 1 is complete only if:

- Repository has zero ESLint errors
- All files auto-format correctly
- Commit hooks enforce rules
- Strict TypeScript passes
- Import sorting works automatically

Only then proceed to Phase 2.

END OF PHASE 1.1


=====================================================================
PHASE 1.5 – CLEAN ARCHITECTURE WITH PRACTICAL SOLID
=====================================================================

GOAL:
Refactor for maintainability and reuse,
without turning this into an over-engineered enterprise system.

Rules:
- Do NOT create new markdown files.
- Append everything into phase1.md.
- Refactor existing code.
- Preserve behavior.
- Avoid unnecessary abstraction layers.
- Favor clarity over cleverness.

=====================================================================
1. SHARED CORE LAYER (REUSE FIRST)
=====================================================================

Create:

/src/core/
  errors.ts
  types.ts
  constants.ts
  chrome.ts
  async.ts

Purpose:

- errors.ts → unified AppError type + mapper
- types.ts → shared domain types
- constants.ts → message types + storage keys
- chrome.ts → wrapper for chrome APIs
- async.ts → retry, sleep, debounce helpers

Rule:
Anything used in ≥ 2 modules must move to core.

=====================================================================
2. LIGHT SOLID PRINCIPLES
=====================================================================

Apply only these:

S – Single Responsibility (but practical)
O – Open for extension (avoid modification-heavy code)
D – Dependency direction: core → background → popup

We will NOT overuse:
- Interfaces everywhere
- DI containers
- Factory patterns

Keep it simple.

=====================================================================
3. REMOVE DUPLICATION
=====================================================================

Audit:

- Repeated chrome.storage calls
- Repeated try/catch blocks
- Repeated token checks
- Repeated message response structures

Refactor into reusable helpers.

Example:

Instead of repeating:

try {
  ...
} catch (e) {
  return { type: \"ERROR\", message: ... }
}

Create:

handleAsync(fn, errorDomain)

Reuse everywhere.

=====================================================================
4. STORAGE SERVICE – CLEAN BUT SIMPLE
=====================================================================

storage.service.ts must:

- Abstract chrome.storage
- Validate with Zod
- Expose simple API:

getScanMeta()
setScanMeta()

getInvoices()
upsertInvoice()

getMessages()
upsertMessage()

No generic over-complicated repository layer.

Keep it explicit.

=====================================================================
5. AUTH SERVICE – REUSABLE TOKEN CHECK
=====================================================================

Create reusable:

ensureValidToken(): Promise<AccessToken>

Used by:
- gmail.client
- future scan engine

No duplicate token validation logic anywhere else.

=====================================================================
6. GMAIL CLIENT – REUSABLE HTTP CORE
=====================================================================

Create generic:

gmailRequest<T>(endpoint: string, options)

All Gmail calls must go through it.

Benefits:
- Central retry
- Central error mapping
- Central auth injection

No duplicated fetch logic.

=====================================================================
7. MESSAGE CONTRACT – SHARED CONSTANTS
=====================================================================

Move message types to:

/core/constants.ts

Example:

export const MESSAGE = {
  AUTH_LOGIN: \"AUTH_LOGIN\",
  SCAN_START: \"SCAN_START\",
  SCAN_STATUS: \"SCAN_STATUS\"
} as const

No string literals in popup or background.

=====================================================================
8. STATE – SIMPLE BUT EXPLICIT
=====================================================================

Instead of heavy state machine class,
use:

type ScanState =
  | \"idle\"
  | \"scanning\"
  | \"completed\"
  | \"error\"

Create transition helper:

setScanState(next)

Validate allowed transitions using small guard map.

Keep it readable.

=====================================================================
9. ERROR MODEL – ONE SHARED STRUCTURE
=====================================================================

Define:

type AppError = {
  domain: \"auth\" | \"gmail\" | \"storage\" | \"scan\"
  message: string
  recoverable: boolean
}

All modules must convert errors into AppError.

Popup renders based on recoverable flag.

No raw Error usage outside core.

=====================================================================
10. FOLDER STRUCTURE (SIMPLIFIED)
=====================================================================

/src
  /core
  /background
    auth.service.ts
    gmail.client.ts
    scan.service.ts
    storage.service.ts
    state.ts
    messaging.ts
    index.ts
  /popup
    popup.tsx
    state.ts

Flat enough to read.
Modular enough to scale.

=====================================================================
11. WHAT WE ARE NOT DOING
=====================================================================

❌ No DI container
❌ No abstract base classes
❌ No excessive generics
❌ No CQRS
❌ No event bus
❌ No micro-layer splitting

This is a Chrome extension.
Keep it lean.

=====================================================================
12. PHASE 2 READINESS CHECK
=====================================================================

Before moving on:

✔ No duplicate logic
✔ Shared helpers centralized
✔ Auth reusable
✔ Gmail reusable
✔ Storage validated
✔ Messaging consistent
✔ No ESLint errors
✔ No TS errors
✔ Code easy to read in < 5 minutes

If code is hard to read,
you over-engineered.

=====================================================================
END OF PHASE 1.5 – CLEAN SOLID MODE
=====================================================================

=====================================================================
PHASE 1.5 (IMPLEMENTED IN REPO) – NOTES
=====================================================================

Intent:
- Keep behavior the same (OAuth/login/logout/profile fetch + thin popup UI).
- Reduce duplication and move cross-cutting helpers into /src/core.
- Keep SOLID “light”: no DI container, no abstract base classes, no generic repositories.

What changed (high-level):
- Introduced /src/core as the only shared “reuse-first” layer.
- Flattened background into small services (auth, gmail client, storage, messaging, state).
- Centralized RPC message type strings in a shared constant to remove string literals.
- Unified AppError shape to: domain + message + recoverable (+ optional details).

Key files (Phase 1.5):
- src/core/constants.ts
  - messageType (RPC contract constants)
  - storageKeys (storage key constants)
  - runtimeUnavailableError
- src/core/chrome.ts
  - runtimeSendMessage(), storageLocalGet/Set/Remove(), identityGetAuthToken(), identityRemoveCachedAuthToken()
- src/core/errors.ts
  - AppError type (domain/message/recoverable)
  - toAppError(domain, e) + handleAsync()
- src/core/async.ts
  - sleep(), retry(), debounce()

Background (simplified + explicit):
- src/background/auth.service.ts
  - ensureValidToken() shared token getter (no duplicated token checks)
  - login(), logoutBestEffort(), clearTokenCache()
- src/background/gmail.client.ts
  - gmailRequest<T>() shared HTTP core for Gmail calls
  - fetchGmailProfile() implemented via gmailRequest()
  - central retry-on-401 behavior (token cache clear + best-effort cached token removal)
- src/background/storage.service.ts
  - Explicit storage APIs for Phase 2 (scan meta, invoices, messages), validated via Zod
- src/background/state.ts
  - Background store + hydration/persistence (uses storageKeys.persistedBackgroundState)
- src/background/messaging.ts
  - One place for RPC parsing + routing + response shaping
  - Uses messageType constants (no RPC string literals)
- src/background/index.ts
  - Boots initBackground() and registers messaging

Popup adjustments (behavior preserved):
- Popup RPC calls now use messageType constants instead of string literals.
- RpcError now exposes domain + recoverable (instead of code), and popup formats errors accordingly.

Validation:
- npm run lint → PASS
- npm run build → PASS
