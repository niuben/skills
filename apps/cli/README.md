# @taoai/skill-cli

<p align="center">
  <img src="../web/public/ding-logo.svg" alt="Skills Hub" width="96" height="96" />
</p>

CLI for Skills Hub artifact operations: publish, list, install, sync, login, and local server control.

## Features

- Publish artifacts from source directory or legacy manifest+payload
- Install artifacts by full id or by name+kind
- List local artifacts with filters
- Sync skills from remote registry for the current user
- Login to registry and persist token
- Start/stop/restart local server

## Requirements

- Node.js 18+
- pnpm 9+

## Install

From monorepo root:

```bash
pnpm --filter @taoai/skill-cli build
pnpm --filter @taoai/skill-cli publish --access public
```

After publishing:

```bash
npm i -g @taoai/skill-cli
skill --help
```

## Local Development

Run from this package directory:

```bash
pnpm install
pnpm build
node dist/index.js --help
```

Watch mode:

```bash
pnpm dev
```

## Commands

```bash
skill --help
```

### login

```bash
skill login
```

Prompts for username/password, calls `POST /api/auth/login`, and saves token to local config.

### list

```bash
skill list --limit 50
skill list --kind skills --query review
```

### publish

Publish from source directory (recommended):

```bash
skill publish --source ./my-skill
skill publish --source ./my-skill --version 1.2.0
```

Legacy mode:

```bash
skill publish --manifest ./manifest.json --payload ./artifact.tgz
```

### install

Install by full artifact id:

```bash
skill install skills:team/code-review@1.0.0
```

Install by name (default kind is `skills`):

```bash
skill install team/code-review --kind skills
```

### sync

```bash
skill sync
skill sync --username alice
skill sync --output ./downloads
```

### server

```bash
skill server start
skill server stop
skill server restart
```

## Artifact Kinds

Supported kinds:

- `skills`
- `prompt`
- `agent`

## Notes

> [!NOTE]
> This package is scoped and configured for public npm publishing (`publishConfig.access=public`).

> [!WARNING]
> Do not run `npm publish` from monorepo root if you only want to release CLI. Publish this package specifically.
