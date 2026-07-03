# Task Manager plugin

Community **module plugin** (`phoundry.taskmanager`) — functional todo app with named lists, priorities, and due dates. Distinct from **phials-plugin-example** (minimal starter for command + preview only).

## Language

**Task list**:
A named collection of tasks (e.g. Inbox, Work). Stored in the plugin database `lists` table; one list is active in the module UI at a time.
_Avoid_: "project" when meaning a Phials vial or workspace.

**Inbox list**:
The default list created on first plugin activation. Cannot be deleted.
_Avoid_: treating Inbox as a special task type.

**Task**:
A single todo item with title, priority (Low/Medium/High), optional date-only due date, and completed flag. Stored in the plugin database `tasks` table.
_Avoid_: file-linked tasks or notes in v1.

## Relationships

- **Task list** contains many **tasks**
- Module UI is a **plugin surface** ([Phials plugin surfaces](https://github.com/phoundry/phials/blob/main/docs/context/plugins/plugin-surfaces.md))
- Persistence uses **plugin database API** (not vial files or plugin storage KV)

## Related

- [phials-plugin-example](https://github.com/phoundry/phials-plugin-example) — minimal cloneable starter
