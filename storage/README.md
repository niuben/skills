# Local data root (runtime-generated)

This directory is the default `dataDir` when `SKILLOS_HOME` is unset
**only for in-repo dev runs**. By default the platform stores data in
`~/.skillos/`.

Contents created at runtime:
- `artifacts/`  — file-storage blobs, organized as `kind/name/version.tgz`
- `db.sqlite`   — metadata database
- `config.json` — resolved configuration (auto-created on first run)
- `installed/`  — extracted artifacts produced by `skillos install`
