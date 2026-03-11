# Repository Guidelines

## Project Structure & Module Organization

- `src/` is the main codebase.
- Grid rendering primitives are in `src/components/data-grid/`.
- Column factories are in `src/columns/`, and shared type contracts are in `src/types/`.
- Feature-specific logic is organized in `src/features/`.
- Demo integration is in `src/demo/`, helpers and mock data are in `src/utils/`.
- Roadmap and spec documents are in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Implementation Status

- **Implemented**: Phase 1 -9 as per docs/superpowers/plans/.
- **Pending**: None.
- When contributing, align changes to the current phase plan files (e.g., `docs/superpowers/plans/xxx.md`) and avoid introducing out-of-phase behavior.

## Coding Style & Naming Conventions

- TypeScript + React function components only.
- Avoid barrel files index.ts and use @convetion for imports.
- Use Shadcn components for UI first, check the registry for shadcn available components and components/ui for existing components (if not available then create your own tags).
- Follow Prettier config: 2 spaces, no semicolons, double quotes, trailing commas (`es5`), print width 80.
- Use kebab-case filenames (e.g., `multi-value-column.tsx`, `use-data-grid.ts`).
- Use theme tokens/CSS variables; avoid hardcoded colors in grid UI.

## Commit & Pull Request Guidelines

- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.) and keep scope focused.
- PRs should include: summary, linked issue/spec, validation commands run, and UI screenshots for visual changes.
- For phase work, reference the exact phase doc in the PR description.

## Commands

- `npm run dev` - Start Vite dev server.
- `npm run build` - Run TypeScript build and produce production bundle.
