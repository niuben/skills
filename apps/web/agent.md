
**apps/web — Package Overview**

- **Purpose**: Frontend single-page application (Vite + React + TypeScript) providing UI for searching, publishing, listing, and viewing artifact details.
- **Main files**: `src/main.tsx`, `src/App.tsx`, `src/pages/*` (PublishPage, LoginPage, ListPage, DetailPage), `src/api.ts` (backend API wrapper).
- **Exports / API**: Built assets produced by `vite build` under `dist/`, suitable for serving by the server or a static host.
- **Runtime notes**: Pay attention to backend API endpoints and CORS configuration; manage asset paths/versioning for deployed builds.
- **Notes**: Global styles in `src/styles.css`, components designed to be small and reusable.
