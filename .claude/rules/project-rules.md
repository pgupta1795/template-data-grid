# Project Rules

## Coding Style
- **Architecture**: Follow the "headless-but-opinionated" pattern.
  - Orchestration: `src/hooks/use-data-grid.ts`
  - Features: `src/features/*` (modular logic)
  - Components: `src/components/data-grid/*` (render layer)
  - Columns: `src/columns/*` (factory helpers)
- **Stack**: Use React, TypeScript, TanStack (Table, Query, Virtual), and Vite.
- **Standards**: Maintain high accessibility standards, performant virtualization, and clean UI/UX with smooth animations.

## Commit Style
All commits MUST follow this format:
`type: phase X task Y __ description`

Examples:
- `fix: phase 9 completed __ done with scheduled tasks`
- `feat: phase 10 task 1 __ created module`

## UI & Components
- **shadcn/ui**: ONLY use shadcn/ui primitives for UI building blocks. Do not introduce alternative UI libraries.
- **Styling**: Use Vanilla CSS for flexible control, avoiding TailwindCSS unless specifically requested.

## Testing
- **No Test Files**: Do NOT create or use test scripts or test files (e.g., `.test.ts`, `.spec.tsx`). Verification should be done via manual inspection or documented walkthroughs.

## Token Efficiency
- **Be Concise**: When performing code reviews or providing explanations, be mindful of token usage and context size. Avoid being "token hungry" by keeping feedback focused and succinct.
