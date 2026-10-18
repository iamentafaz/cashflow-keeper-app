# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application. Route pages live in `src/app/` (for example, `src/app/finance/page.tsx`), reusable feature components are grouped under `src/components/finance/` and `src/components/profile/`, and shared shadcn-style primitives are in `src/components/ui/`. Hooks, utilities, types, Redux state, and static assets are organized in `src/hooks/`, `src/lib/`, `src/types/`, `src/store/`, and `src/assets/`. Public files belong in `public/`. Supabase schema and ordered migrations are in `supabase/schema/` and `supabase/migrations/`; update SQL deliberately and preserve migration ordering.

## Build, Test, and Development Commands

```sh
npm install          # install dependencies
npm run dev          # start the local Next.js server
npm run lint         # run ESLint
npx tsc --noEmit     # type-check without emitting files
npm run build        # create a production build
npm start            # serve the production build locally
```

There is currently no automated test runner configured. Run lint, type-check, and build checks before submitting changes. Configure `.env.local` with the Supabase URL, publishable key, and site URL as described in `README.md`.

## Coding Style & Naming Conventions

Use TypeScript and React function components with two-space indentation. Follow the existing ESLint configuration and use the `@/*` alias for imports from `src/`. Name components and component files in PascalCase, hooks with the `use*` pattern, utilities in kebab/camel case consistent with nearby files, and route folders by their URL segment. Prefer small feature components and shared UI primitives over duplicating markup or styles.

## Testing Guidelines

No test framework or coverage threshold is present. For UI or data changes, manually exercise the affected route and run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Verify Supabase-dependent flows against a configured development project.

## Commit & Pull Request Guidelines

Keep commits focused and use concise imperative subjects. Existing history uses both plain subjects and Conventional Commit prefixes such as `feat:` and `fix:`; either is acceptable when consistent with the change. Pull requests should explain the user-visible behavior, identify affected routes or migrations, list validation commands, link related issues, and include screenshots for visual changes. Call out any required SQL migration or environment-variable change explicitly.

## Security & Configuration Tips

Never commit `.env.local`, service-role keys, credentials, or user receipt data. Supabase changes must preserve row-level security and ownership checks. Apply migrations in order and treat destructive SQL, including legacy table removal, as a deliberate deployment step.
