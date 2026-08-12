# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this service does

`pdf-render-server` is a NestJS service with a single job: accept HTML via `POST /pdf/_actions/render` and return
a rendered PDF (binary `application/pdf` response), using a headless Chromium instance (Puppeteer) under the hood.
It is built on `@fsarch/server`, a shared internal NestJS toolkit (app bootstrap, auth, UAC/roles, config loading)
used across `fsarch`-prefixed services.

## Commands

```bash
npm run start:dev     # run with watch mode (nest start --watch)
npm run build         # nest build -> dist/
npm run start:prod    # run built output (node dist/main)

npm run lint          # eslint --fix over src/apps/libs/test
npm run format        # prettier --write src/**/*.ts test/**/*.ts

npm run test          # vitest run (unit tests, *.spec.ts, uses vitest.config.ts)
npm run test:watch    # vitest watch mode
npm run test:cov      # vitest run --coverage
npm run test:e2e      # vitest run --config ./test/vitest.e2e.config.ts
```

Run a single test file: `npx vitest run src/controllers/render/render.service.spec.ts`
Run tests matching a name: `npx vitest run -t "should be defined"`

There is no database in this service (no `setDatabase(...)` call in `main.ts`, no TypeORM entities), even though
`typeorm`/`pg`/typeorm-related npm scripts exist as leftover boilerplate from the shared service template — don't
assume persistence is wired up.

## Runtime requirements

- Needs a `config.yaml` (or `config.yml`) in the project root — loaded by `@fsarch/server`, path overridable via
  `CONFIG_FILE_PATH`. See `config/config.yml` for the local example (`auth` + `uac` sections). Both `config.yml` and
  `config.yaml` are gitignored, so don't assume the checked-in example reflects prod.
- `CHROMIUM_EXECUTABLE_PATH` env var points Puppeteer at a system Chromium binary (set in the `Dockerfile`; needed
  locally too unless Puppeteer's bundled Chromium is available).
- fsarch dev-realm OIDC test credentials for hitting the auth-guarded endpoint locally are documented in the global
  CLAUDE.md instructions (`~/.claude/fsarch-test-credentials.md`).

## Architecture

Standard Nest module tree: `AppModule` → `ControllersModule` → `RenderModule` (controller + service). There's
exactly one feature module (`render`); follow its shape (`*.module.ts` / `*.controller.ts` / `*.service.ts` +
co-located `*.spec.ts`) when adding new endpoints, and register new feature modules in `ControllersModule`.

**Bootstrap (`src/main.ts`)**: uses `FsArchAppBuilder` from `@fsarch/server` instead of Nest's raw
`NestFactory.create`. `.enableAuth()` wires up the auth guard/strategy described by the `auth:` section of
`config.yaml`; `.addSwagger()` publishes OpenAPI docs. Express's JSON body parser is manually configured with a
50mb limit (`app.use(express.json({limit: '50mb'}))`) because rendered HTML payloads can be large.

**Auth & permissions**: endpoints are protected with `@UseGuards(AuthGuard)` + `@Roles(Role.xxx)` from
`@fsarch/server/auth` and `@fsarch/server/uac`, not hand-rolled guards. Roles are declared centrally in
`src/constants/role.enum.ts` (currently just `render_pdf`). The controller class itself is annotated `@Public()`
but the individual route re-guards with `AuthGuard` — `@Public()` at class level does not mean the endpoints are
open; check the guards on the actual route handler. Which `user_id`s hold which permissions is defined in the
`uac:` section of `config.yaml` (static UAC provider).

**PDF rendering (`render.service.ts`)**: maintains a single module-level lazy-initialized Puppeteer `Browser`
instance (`BROWSER`) reused across requests rather than one browser per request; it self-heals by relaunching if
the browser has disconnected. Each render gets its own `Page` via `usePage()`, which always closes the page in a
`finally` block. JavaScript execution and all network requests are deliberately disabled/aborted on the page
(`setJavaScriptEnabled(false)` + request interception that aborts everything) — rendering is meant to work purely
off the inlined HTML passed in, not live network content. When touching this file, preserve that isolation
behavior rather than "fixing" it to allow requests through.

**Render options DTO (`RenderPdfDto.ts`)**: `PaperFormat` enum mirrors Puppeteer's built-in paper sizes plus a
`CUSTOM` value; when `export.format === PaperFormat.CUSTOM`, `export.width`/`export.height` are used instead of
Puppeteer's named format, and `landscape` is forced `false`. Keep new export options consistent with this
format/custom-dimensions split.

## Module system notes

The project is ESM (`"type": "module"` in `package.json`, `NodeNext` module resolution). All relative imports
must include the `.js` extension even though the source is `.ts` (e.g. `import { AppModule } from './app.module.js'`).
Vitest specs import `reflect-metadata` via `test.setup.js` before anything else — required for decorator metadata
used by Nest DI and `class-validator`.