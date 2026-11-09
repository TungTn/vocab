# LinguaFlow — Workspace Rules

All agents and contributors working in this repository must follow the architectural guidelines, strict TypeScript invariants, and skills mapping defined in [SKILL.md](file:///d:/vocab/SKILL.md) and [docs/skills-and-rules.md](file:///d:/vocab/docs/skills-and-rules.md):

1. **Monorepo Boundaries**: Shared types and Zod schemas live strictly in `packages/shared-types`. No cross-app imports between `apps/`.
2. **Type Safety**: TypeScript `strict: true`. No `any` type allowed.
3. **SRS Integrity**: Pure TypeScript calculations in `packages/srs-engine` with idempotent card review submissions.
4. **Security & Auth**: Short-lived JWT (15 min) + httpOnly refresh tokens in cookies. Passwords hashed with Argon2id.
5. **Git Workflow**: Conventional commits format `feat(...)`, `fix(...)`, `chore(...)`.
6. **Domain Skills Reference**:
   - Backend API, Database, Redis, Auth & AI: [.agents/skills/be-global/SKILL.md](file:///d:/vocab/.agents/skills/be-global/SKILL.md)
   - Frontend Web (Next.js 15) & Mobile (Expo): [.agents/skills/fe-global/SKILL.md](file:///d:/vocab/.agents/skills/fe-global/SKILL.md)
   - Core Architecture & Project Rules: [SKILL.md](file:///d:/vocab/SKILL.md) / [.agents/skills/linguaflow-core/SKILL.md](file:///d:/vocab/.agents/skills/linguaflow-core/SKILL.md)
