# API mutator (hand-written)

Orval **output** lives under [`src/hooks/orval/`](../../hooks/orval/).

This folder only holds the fetch mutator used by generated hooks:

- [`mutator/custom-instance.ts`](./mutator/custom-instance.ts) — `VITE_POCKETHOST_URL` + `/api` + Bearer from `pb.authStore`

```bash
bun run api:generate
```
