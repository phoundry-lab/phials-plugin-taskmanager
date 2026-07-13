import "./app.css";
import TaskManagerModule from "./task-manager/TaskManagerModule.svelte";
import {
  DATE_FORMAT_RELATIVE,
  PLUGIN_ID,
  SORT_CREATED,
  SORT_DUE_DATE,
  SORT_PRIORITY,
} from "./task-manager/task-manager.data";
import { taskManagerService } from "./task-manager/task-manager.svelte";

const taskDatabase: PluginDatabaseSchema = {
  tables: [
    {
      name: "lists",
      columns: [
        {
          name: "id",
          type: "INTEGER",
          primaryKey: true,
          autoIncrement: true,
        },
        { name: "name", type: "TEXT", notNull: true },
        { name: "sort_order", type: "INTEGER", notNull: true, default: 0 },
        { name: "created_at", type: "TEXT", notNull: true },
      ],
      indexes: [{ name: "sort_order", columns: ["sort_order"] }],
    },
    {
      name: "tasks",
      columns: [
        {
          name: "id",
          type: "INTEGER",
          primaryKey: true,
          autoIncrement: true,
        },
        { name: "list_id", type: "INTEGER", notNull: true },
        { name: "title", type: "TEXT", notNull: true },
        { name: "completed", type: "INTEGER", notNull: true, default: 0 },
        { name: "priority", type: "INTEGER", notNull: true, default: 1 },
        { name: "due_date", type: "TEXT" },
        { name: "created_at", type: "TEXT", notNull: true },
        { name: "sort_order", type: "INTEGER", notNull: true, default: 0 },
      ],
      indexes: [
        { name: "list_id", columns: ["list_id"] },
        { name: "due_date", columns: ["due_date"] },
      ],
    },
  ],
};

const taskSettings: PluginSettingsSchema = {
  title: "Task Manager",
  fields: [
    {
      key: "defaultSort",
      label: "Default sort",
      description: "How tasks are ordered in each list.",
      type: "select",
      default: SORT_CREATED,
      options: [
        { value: SORT_DUE_DATE, label: "Due date" },
        { value: SORT_PRIORITY, label: "Priority" },
        { value: SORT_CREATED, label: "Created" },
      ],
    },
    {
      key: "showCompleted",
      label: "Show completed tasks",
      type: "boolean",
      default: true,
    },
    {
      key: "dateFormat",
      label: "Due date display",
      type: "select",
      default: DATE_FORMAT_RELATIVE,
      options: [
        { value: DATE_FORMAT_RELATIVE, label: "Relative (Today, Tomorrow)" },
        { value: "absolute", label: "Absolute (Jan 5, 2026)" },
      ],
    },
  ],
};

export default function createPlugin(): PhialsPlugin {
  let api: PluginAPI | null = null;

  const moduleProvider: ModuleProvider = {
    type: "module",
    id: PLUGIN_ID,
    name: "Task Manager",
    icon: "mdi:checkbox-marked-outline",
    defaultPosition: "right",
    allowedPositions: ["left", "right", "bottom", "center"],
    component: TaskManagerModule,
    allowMultiple: false,
    getDefaultState: (): TaskManagerModuleState => ({ activeListId: null }),
    getCenterTabIdentity: () => PLUGIN_ID,
  };

  const focusCommand: Command = {
    id: `${PLUGIN_ID}.focus`,
    label: "Focus Task Manager",
    description:
      "Focus the Task Manager module (open it from the right panel if needed)",
    icon: "mdi:checkbox-marked-outline",
    category: "View",
    contextKeys: ["always"],
    action: () => {
      api?.notify.info(
        "Open Task Manager from the panel module picker if it is not visible.",
      );
      api?.events.emit(`${PLUGIN_ID}.focus-request` as keyof EventMap, {});
    },
  };

  const quickAddCommand: Command = {
    id: `${PLUGIN_ID}.quick-add`,
    label: "Quick add task",
    description: "Add a task to the active list",
    icon: "mdi:plus-circle-outline",
    category: "View",
    contextKeys: ["always"],
    action: async () => {
      if (!api) {
        return;
      }

      const title = await api.modal.prompt({
        title: "Quick add task",
        message: "Task title",
        placeholder: "What needs doing?",
      });

      if (title) {
        await taskManagerService.quickAddFromCommand(title);
        api.notify.success("Task added");
      }
    },
  };

  const commandProvider: CommandProvider = {
    type: "command",
    id: `${PLUGIN_ID}.commands`,
    name: "Task Manager commands",
    commands: [focusCommand, quickAddCommand],
  };

  return {
    id: PLUGIN_ID,
    name: "Task Manager",
    version: "0.1.0",
    icons: [moduleProvider.icon],
    settings: taskSettings,
    database: taskDatabase,
    onActivate: (pluginApi: PluginAPI) => {
      api = pluginApi;
      taskManagerService.bindApi(pluginApi);
    },
    onDeactivate: () => {
      taskManagerService.unbindApi();
      api = null;
    },
    providers: [moduleProvider, commandProvider],
  };
}

export { mount, unmount } from "svelte";
