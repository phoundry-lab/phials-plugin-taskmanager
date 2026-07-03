# Phials Task Manager plugin

A functional **task manager** community plugin for [Phials](https://github.com/phoundry/phials): named lists, tasks with priority and optional due dates, plugin database persistence, module UI, command-bar actions, and plugin settings.

Unlike [phials-plugin-example](https://github.com/phoundry/phials-plugin-example) (minimal cloneable starter for command + preview), this repo is a **real plugin** you can install and use daily. It demonstrates **ModuleProvider**, **CommandProvider**, **PluginSettingsSchema**, and **PluginDatabaseSchema**.

**Trust model:** Community plugins are trusted JavaScript in the Phials renderer with a permission-gated `PluginAPI`. See the [public API contract](https://github.com/phoundry/phials/blob/main/documentation/developer/plugins/public-api-contract.md).

## Features

- **Module** — dockable panel (default: right) with list sidebar and task list
- **Lists** — named lists with a protected default **Inbox**
- **Tasks** — title, Low/Medium/High priority, optional date-only due dates, complete/delete
- **Settings** — default sort, show completed, relative vs absolute due dates
- **Commands** — Focus Task Manager, Quick add task
- **Storage** — SQLite tables in `~/.phials/data/plugins.db` via the plugin database API

## Prerequisites

- Node 20+
- Phials `0.1.0` or newer

## Install and build

```bash
npm install
npm run build
npm run validate
npm run check
```

Artifacts: `dist/manifest.json`, `dist/main.js`, `dist/styles.css`.

## Local install in Phials

1. Build this repo (`npm run build`).
2. Copy `dist/*` into your Phials plugins directory under a folder named **`phoundry.taskmanager`** (must match `manifest.id`).
3. Enable the plugin in Phials settings (disable safe mode if browsing community plugins).

## Registry

Listed in [phoundry/phials-plugins](https://github.com/phoundry/phials-plugins) after maintainers merge the registry PR and a GitHub Release is published.

## Release

Create a GitHub Release with `manifest.json`, `main.js`, and `styles.css`. Version in `public/manifest.json` is synced from `package.json` at build time.

## Regenerate SDK (from Phials)

When Phials plugin types change:

```bash
cd /path/to/phials
npm run sdk:sync-plugin-example
# Copy sdk/ into this repo, or add a dedicated sync script
```
