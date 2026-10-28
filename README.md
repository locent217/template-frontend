# Vue 3 Frontend — Developer README

> **Reusable Vue 3 SPA boilerplate** designed for the companion Laravel 13 API. Includes Vite + TypeScript + Pinia + Vuetify, Sanctum cookie authentication, permissions, theme settings, CRUD pages, confirmation dialogs, Reverb notifications, onboarding, password recovery, and Remember Me.

## 1. Project overview and requirements

- Node.js (supported current LTS recommended) and **npm**.
- **Clone the complete frontend repository**. It already contains `package.json`, Vite/TypeScript configuration, `index.html`, and `src/`. Run all npm commands from this frontend repository root.
- Running Laravel backend with working Sanctum cookies, MySQL queue worker, and Reverb for live notifications.

## 2. Install and run

```bash
npm install
npm run dev
```

The dependencies are defined in the cloned project’s `package.json`; `npm install` installs them. If you intentionally add or replace dependencies, the relevant packages include:

```bash
npm install axios pinia vue-router vuetify @mdi/font @fontsource/roboto @fontsource/montserrat laravel-echo pusher-js
```

Use versions compatible with your project's Vue 3 / Vuetify 4 / vue-router setup. Other common commands (if defined in `package.json`):

```bash
npm run build
npm run preview
npm run lint
npm run type-check
```

Check `npm run` to see the scripts actually defined; `lint` and `type-check` may not exist in every project.

## 3. Frontend `.env`

Create `.env.local` or copy `.env.example` (PowerShell: `Copy-Item .env.example .env.local`):

```dotenv
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Company Workspace"
VITE_COMPANY_NAME="My Company"
VITE_APP_TITLE="Company Workspace"
VITE_APP_SHORT_NAME="Workspace"

VITE_REVERB_ENABLED=true
VITE_REVERB_APP_KEY=local-public-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

`VITE_API_URL` is the Laravel **origin**, without `/api` (the API service adds it). Reverb key must equal Laravel's `REVERB_APP_KEY`. Use the same hostname consistently (e.g. localhost for Vue, Laravel, and Reverb); never expose `REVERB_APP_SECRET`, SMTP credentials, or private API keys in `VITE_` variables. Vite embeds `VITE_` values into the browser bundle. Restart `npm run dev` after `.env` changes.

For production, use your HTTPS API origin, WSS hostname/port (usually 443), and `VITE_REVERB_SCHEME=https`; build with the correct production environment. Laravel must allow the exact SPA origin in CORS and include the SPA hostname in Sanctum stateful domains.

## 4. Project structure and conventions

```text
src/
├── pages/                         # Login, Dashboard, CRUD, AuditLogs, AccountRecovery, etc.
├── services/
│   ├── api.ts                     # Axios baseURL, CSRF, credentials, error handling
│   ├── authService.ts             # Login, logout, /me, first-use credentials
│   ├── notificationService.ts     # Notification REST endpoints
│   └── realtime.ts                # Echo + Reverb private notification channel
├── stores/
│   ├── auth.ts                    # Authenticated user, permission state
│   ├── notification.ts            # Bell data, unread count, subscriptions
│   └── theme.ts                   # Theme settings
├── components/
│   ├── notifications/NotificationBell.vue
│   ├── layout/AppHeader.vue
│   └── GlobalConfirmDialog.vue
├── composables/useConfirm.ts
├── router/index.ts                # Guards and page routes
├── layouts/MainLayout.vue
└── config/app.ts                   # Public branding / API config
```

Use a **page → service → API** flow: keep network calls in `src/services`, shared state in Pinia, and page/UI state in Vue components. Add route permissions and navigation links for each new module; the Laravel module generator does not create Vue files automatically.

## 5. Authentication and first-use setup

1. The login page requests `/sanctum/csrf-cookie` through the configured Axios flow, then posts username/password to `/api/login`.
2. Axios (`src/services/api.ts`) sends cookies with `withCredentials: true` and XSRF handling.
3. On page reload, the auth store requests `GET /api/me`; **the server response is authoritative** (not a localStorage `isLoggedIn` flag).
4. Route guards in `src/router/index.ts` redirect guests to login, restrict pages by permission, and send users with `first_use=true` to `/first-use`.
5. `src/pages/FirstUseCredentials.vue` posts the current/temporary password, new username, new password and confirmation to `/api/account/credentials`. On success it refreshes auth state and redirects to `/dashboard`.
6. The login page has an unchecked-by-default **Remember me** checkbox; `authService.ts` includes `remember: true|false` in the login request. Laravel manages the remember cookie. Never save the user's password or remember token in the browser.

## 6. Account recovery and security pages

| Page | Behavior |
|---|---|
| `pages/Login.vue` | Login, Remember Me, recovery link, temporary success banner |
| `pages/AccountRecovery.vue` | Forgot username by email; forgot password by emailed OTP |
| `pages/ChangePassword.vue` | Authenticated password change via top-right account menu |
| `pages/FirstUseCredentials.vue` | Mandatory first-use username/password update |

Backend endpoints:

```text
POST /api/account/forgot-username
POST /api/account/forgot-password
POST /api/account/reset-password
POST /api/account/change-password
POST /api/account/credentials
```

After authenticated password change or first-use setup, navigate to `/dashboard`. After successful OTP reset while logged out, clear **email, OTP, new password, confirmation, and previous error state**, then navigate to `/login`; the success banner should disappear after **3 seconds**. The forgot-username success flow clears the email; switching recovery modes clears stale fields/messages. Keep API errors visible and do not redirect on failure.

## 7. Notifications — step-by-step frontend integration

**Required existing files:**

| File | Role |
|---|---|
| `src/services/realtime.ts` | Creates Laravel Echo/Pusher client and authorizes private channels |
| `src/services/notificationService.ts` | Calls Laravel notification API |
| `src/stores/notification.ts` | Fetches list/count; subscribes and refreshes |
| `src/components/notifications/NotificationBell.vue` | Unread badge, list, read/unread actions |
| `src/components/layout/AppHeader.vue` | Renders the notification bell |
| `src/stores/auth.ts` | Provides authenticated user ID |

### Set up once

1. Install `laravel-echo` and `pusher-js` with npm (if missing).
2. Set `VITE_REVERB_ENABLED=true`, public key, host, port and scheme; restart Vite.
3. Ensure `src/services/api.ts` uses the same Sanctum-enabled Axios client for both REST requests and Reverb private-channel authorization (`/broadcasting/auth`).
4. When `/api/me` succeeds, `src/stores/notification.ts` fetches notifications and subscribes to `App.Models.User.{userId}` through `subscribeToNotifications()` in `realtime.ts`.
5. On a Reverb notification event, refresh the list/unread count using `notificationService.ts`; the existing backend broadcasts a **refresh signal**, not necessarily the full record.
6. Render `NotificationBell.vue` in `AppHeader.vue`; call read/unread endpoints when users interact. Unsubscribe on logout/account switch.
7. The store also uses periodic polling as a fallback when appropriate.

### Add a new notification feature

1. **Backend:** create a queued notification class under `app/Notifications`, with `via()` returning `['database', 'broadcast']`, `toArray()` returning `title`, `message`, `type`, `url`, and `toBroadcast()` emitting a refresh signal; dispatch to the intended user.
2. **Frontend:** if the new notification uses the same payload shape, the existing store and bell work without a new listener. If you introduce new `type` behavior, update `NotificationBell.vue` (display/icon/navigation) accordingly.
3. Test with Laravel server, **queue worker**, **Reverb**, and Vite running; verify unread badge changes without refresh.

Backend notification endpoints:

```text
GET   /api/notifications
PATCH /api/notifications/{id}/read
PATCH /api/notifications/{id}/unread
```

Debug via browser Developer Tools → Network → WS and the `/broadcasting/auth` request. A `401`/`403` suggests Sanctum cookies/channel authorization; no websocket connection suggests Reverb host/key/scheme/port; a connected websocket but stale badge suggests queue worker/subscription problems.

## 8. Email — what frontend developers need to do

**Email sending is implemented in Laravel**, not Vue. Vue does **not** need SMTP credentials.

1. Laravel configures `MAIL_*` and `FRONTEND_URL` in its `.env`.
2. Laravel mailables live under `app/Mail/`; HTML templates live under `resources/views/emails/`.
3. The backend triggers emails on user creation, forgot username, OTP request, and successful password changes.
4. Vue invokes the relevant API through a service and shows success/error states. Do not send passwords or OTPs to any third-party frontend mail service.
5. For a new email-triggering feature, add a Laravel mailable and Blade template, dispatch it from the Laravel service, then call the new protected/public API from a Vue service and page.
6. Test the user-facing link in the email: it must point to the **Vue frontend**, not the Laravel API.

## 9. Add a new CRUD page/module

1. Ask the backend developer to run `php artisan make:module-model Product --module`, implement the repository/service, migration, controller, routes, and permissions.
2. Create `src/services/products.ts` using the shared `api` client.
3. Create `src/pages/Products.vue` with Vuetify forms/table and loading/error states.
4. Register the route in `src/router/index.ts` with authentication and appropriate permission metadata.
5. Add the navigation item; use `useConfirm` for destructive actions and keep server-side validation/permission checks authoritative.
6. Test using a user with and without permissions.

## 10. Production and troubleshooting

```bash
npm install
npm run build
# Deploy the generated dist/ folder using your static frontend hosting / Nginx.
```

Configure SPA history fallback to `index.html`, HTTPS, and the correct backend and Reverb URLs **before** building. Serve the frontend and API from compatible same-site domains for Sanctum cookies. Use browser DevTools to check CORS, CSRF, cookies, websocket connections, and failed requests.

| Problem | Fix/check |
|---|---|
| `npm install` fails: no package.json | Verify you are running the command in the cloned frontend repository root |
| Login 419 | CSRF cookie, Axios XSRF config, Sanctum/CORS/hostnames |
| Login 401 | Credentials, session cookie, `/api/me` response |
| Redirect loop after login | `first_use`, auth store initialization, route guards |
| Bell updates only after refresh | `VITE_REVERB_ENABLED`, Reverb/queue processes, private auth, WS connection |
| Reset success banner persists | Check 3-second timer/cleanup and query parameter removal |
| `VITE_` change not applied | Restart Vite / rebuild production bundle |

See the **backend README** for the exact Laravel configuration, generator, notification implementation, SMTP/Blade setup, migrations, and worker commands.
