---
name: esbuild external packages and schema quirks
description: Packages that must be external in build.mjs, and key schema column names that differ from intuition
---

## esbuild External Packages
Packages using `@swc/helpers` or CJS-only dynamic requires break esbuild bundling and must be in the `external` array in `artifacts/api-server/build.mjs`:
- `pdfkit` — depends on `fontkit`
- `fontkit` — uses `@swc/helpers`
- `brotli` — loaded dynamically by fontkit
- `@swc/helpers` — CJS helper package
- `twilio` — large SDK, better external
- `mercadopago` — large SDK, better external

**Why:** esbuild bundles to ESM but fontkit uses `require('@swc/helpers/cjs/_define_property.cjs')` at runtime — path not resolvable after bundling. Making the package external lets Node.js resolve it from node_modules at runtime.

**How to apply:** Any new npm package that fails with `Cannot find module '@swc/helpers'` or similar CJS dynamic require errors — add to `external` in build.mjs.

## Schema Column Name Quirks
- `subscriptions.currentPeriodEnd` — NOT `expiresAt` (Stripe naming convention carried over)
- `transactions.walletId` — NOT NULL, must always get/create wallet before insert:
  ```typescript
  const wallet = await getOrCreateWallet(userId);
  await db.insert(transactionsTable).values({ walletId: wallet.id, ... });
  ```
- `password_reset_tokens.tokenHash` — stores SHA-256 hash of raw token, raw token goes in email URL
