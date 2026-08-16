# E2E (Playwright)

Tests de punta a punta contra la app real (frontend + backend + DB) — no
contra mocks. **Nunca se corrieron todavía** (ver DECISIONES.md, "Testing de
frontend con Playwright"): quedaron escritos y listos, pero hace falta
correrlos manualmente al menos una vez para confirmar que los selectores
(labels/textos de botones, inferidos leyendo el código de `@refinedev/antd`,
no viéndolos renderizados) matchean pixel a pixel.

## Requisitos antes de correr

1. **La app tiene que estar corriendo** — Playwright no la levanta (ver
   comentario en `playwright.config.ts`): ni `docker compose up` ni el setup
   nativo se arrancan solos. Levantala vos primero, como siempre.
2. **`MAIL_MAILER=log` en el backend** (default del proyecto) — los tests que
   pasan por invitación/recuperación de contraseña (`set-password.spec.ts`,
   parte de `login.spec.ts`) leen el link directo de
   `backend/storage/logs/laravel.log` en vez de un mail real (mismo mecanismo
   manual que ya documenta ESTADO.md, automatizado en
   `e2e/support/mail-log.ts`).
3. **El `RoleSeeder` tiene que estar corrido** (`administrador@inmova.test`,
   `propietario@inmova.test`, etc.) — los tests lo asumen para loguearse como
   admin y armar datos de prueba vía API (`e2e/support/api.ts`).

## Variables de entorno (todas opcionales, con default)

| Variable | Default | Para qué |
|---|---|---|
| `PLAYWRIGHT_BASE_URL` | `http://app.inmova.test:25173` | Frontend (dev en Docker, ver DECISIONES.md) |
| `PLAYWRIGHT_API_URL` | `http://api.inmova.test:2090/api` | Backend, para el setup vía API |
| `SEED_PASSWORD` | `password` | Password de las cuentas seedeadas — pisalo si tu `backend/.env` tiene un `DEFAULT_SEED_PASSWORD` custom (ej. `SEED_PASSWORD=$(grep DEFAULT_SEED_PASSWORD ../backend/.env \| cut -d= -f2) npm run test:e2e`) |
| `PLAYWRIGHT_BACKEND_LOG_PATH` | `../backend/storage/logs/laravel.log` (relativo al repo) | Si el log del backend vive en otro lado (ej. corriendo en otra máquina/VM) |

Si corrés contra el setup nativo (Apache, no Docker) en vez del de Docker,
pisá `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_API_URL` con esos puertos.

## Correr

```bash
npm run test:e2e            # headless, una corrida
npx playwright test --ui    # modo interactivo, mejor para debuggear un fallo
npx playwright show-report  # ver el último reporte HTML
```

## Qué cubre

- `login.spec.ts`: login correcto, password incorrecta, cuenta nunca
  activada, cuenta desactivada — los 4 casos de `AuthController::login`.
- `user-management.spec.ts`: guard de rol (`RoleRoute`), alta de usuario vía
  UI, activar/desactivar desde el listado.
- `set-password.spec.ts`: invitación completa (admin crea → usuario activa →
  login), recuperación self-service ("olvidé mi contraseña"), link inválido.

Lo que **no** cubre a propósito: reenvío de invitación (cubierto ya por unit
tests + los otros dos flujos que pasan por el mismo mecanismo), y no hay
tests de UI para los mensajes de validación de Ant Design (ya cubiertos
indirectamente por los casos de arriba).
