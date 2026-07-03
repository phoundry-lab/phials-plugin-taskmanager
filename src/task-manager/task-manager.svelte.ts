import {
	INBOX_LIST_NAME,
	PLUGIN_ID,
	PRIORITY_MEDIUM,
	SORT_CREATED,
} from "./task-manager.data";
import { compareTasks } from "./task-manager.logic";

const FOCUS_EVENT = `${PLUGIN_ID}.focus-request` as const;

class TaskManagerService {
	#api: PluginAPI | null = null;
	#focusSubscription: EventSubscription | null = null;

	lists = $state<TaskListRow[]>([]);
	tasks = $state<TaskRow[]>([]);
	activeListId = $state<number | null>(null);
	loading = $state(false);

	#focusAddHandler: (() => void) | null = null;

	bindApi(api: PluginAPI): void {
		this.#api = api;
		api.events.register("focus-request", "Focus the task manager add field");
		this.#focusSubscription?.unsubscribe();
		this.#focusSubscription = api.events.on(
			FOCUS_EVENT as keyof EventMap,
			() => {
				this.requestFocusAddInput();
			},
		);
	}

	setFocusAddHandler(handler: (() => void) | null): void {
		this.#focusAddHandler = handler;
	}

	unbindApi(): void {
		this.#focusSubscription?.unsubscribe();
		this.#focusSubscription = null;
		this.#api = null;
	}

	get api(): PluginAPI | null {
		return this.#api;
	}

	readonly sortedTasks = $derived.by(() => {
		const api = this.#api;
		const sortKey =
			(api?.settings.get<TaskSortKey>("defaultSort") as TaskSortKey | undefined) ??
			SORT_CREATED;
		const showCompleted = api?.settings.get<boolean>("showCompleted") ?? true;
		const listId = this.activeListId;

		return [...this.tasks]
			.filter((task) => task.list_id === listId)
			.filter((task) => showCompleted || !task.completed)
			.sort((a, b) => compareTasks(a, b, sortKey));
	});

	requestFocusAddInput(): void {
		this.#focusAddHandler?.();
	}

	async initialize(): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		this.loading = true;
		try {
			await this.#ensureInboxList();
			await this.refresh();
		} finally {
			this.loading = false;
		}
	}

	async refresh(): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		this.lists = await api.database.selectAll<TaskListRow>(
			"lists",
			undefined,
			[],
		);
		this.lists.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

		if (this.activeListId === null) {
			const inbox =
				this.lists.find((list) => list.name === INBOX_LIST_NAME) ??
				this.lists[0] ??
				null;
			this.activeListId = inbox?.id ?? null;
		} else if (!this.lists.some((list) => list.id === this.activeListId)) {
			this.activeListId = this.lists[0]?.id ?? null;
		}

		if (this.activeListId !== null) {
			this.tasks = await api.database.selectAll<TaskRow>(
				"tasks",
				"list_id = ?",
				[this.activeListId],
			);
		} else {
			this.tasks = [];
		}
	}

	async selectList(listId: number): Promise<void> {
		this.activeListId = listId;
		await this.refresh();
	}

	async createList(name: string): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		const trimmed = name.trim();
		if (!trimmed) {
			return;
		}

		const sortOrder = this.lists.length;
		const id = await api.database.insert("lists", {
			name: trimmed,
			sort_order: sortOrder,
			created_at: new Date().toISOString(),
		});

		await this.refresh();
		this.activeListId = id;
	}

	async deleteList(listId: number): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		const list = this.lists.find((entry) => entry.id === listId);
		if (!list || list.name === INBOX_LIST_NAME) {
			return;
		}

		await api.database.deleteFrom("tasks", "list_id = ?", [listId]);
		await api.database.deleteFrom("lists", "id = ?", [listId]);

		if (this.activeListId === listId) {
			const inbox = this.lists.find((entry) => entry.name === INBOX_LIST_NAME);
			this.activeListId = inbox?.id ?? null;
		}

		await this.refresh();
	}

	async addTask(
		title: string,
		options?: { listId?: number; priority?: TaskPriority; dueDate?: string | null },
	): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		const trimmed = title.trim();
		if (!trimmed) {
			return;
		}

		const listId = options?.listId ?? this.activeListId;
		if (listId === null) {
			return;
		}

		const id = await api.database.insert("tasks", {
			list_id: listId,
			title: trimmed,
			completed: 0,
			priority: options?.priority ?? PRIORITY_MEDIUM,
			due_date: options?.dueDate ?? null,
			created_at: new Date().toISOString(),
			sort_order: this.tasks.length,
		});

		const row: TaskRow = {
			id,
			list_id: listId,
			title: trimmed,
			completed: 0,
			priority: options?.priority ?? PRIORITY_MEDIUM,
			due_date: options?.dueDate ?? null,
			created_at: new Date().toISOString(),
			sort_order: this.tasks.length,
		};

		if (listId === this.activeListId) {
			this.tasks = [...this.tasks, row];
		}
	}

	async toggleTaskCompleted(taskId: number): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		const task = this.tasks.find((entry) => entry.id === taskId);
		if (!task) {
			return;
		}

		const completed = task.completed ? 0 : 1;
		await api.database.update("tasks", { completed }, "id = ?", [taskId]);
		task.completed = completed;
		this.tasks = [...this.tasks];
	}

	async updateTaskPriority(taskId: number, priority: TaskPriority): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		await api.database.update("tasks", { priority }, "id = ?", [taskId]);
		const task = this.tasks.find((entry) => entry.id === taskId);
		if (task) {
			task.priority = priority;
			this.tasks = [...this.tasks];
		}
	}

	async updateTaskDueDate(
		taskId: number,
		dueDate: string | null,
	): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		await api.database.update("tasks", { due_date: dueDate }, "id = ?", [
			taskId,
		]);
		const task = this.tasks.find((entry) => entry.id === taskId);
		if (task) {
			task.due_date = dueDate;
			this.tasks = [...this.tasks];
		}
	}

	async deleteTask(taskId: number): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		await api.database.deleteFrom("tasks", "id = ?", [taskId]);
		this.tasks = this.tasks.filter((task) => task.id !== taskId);
	}

	async quickAddFromCommand(title: string): Promise<void> {
		await this.addTask(title);
		this.requestFocusAddInput();
		this.#api?.events.emit(FOCUS_EVENT as keyof EventMap, {});
	}

	async #ensureInboxList(): Promise<void> {
		const api = this.#api;
		if (!api) {
			return;
		}

		const existing = await api.database.selectAll<TaskListRow>(
			"lists",
			"name = ?",
			[INBOX_LIST_NAME],
		);

		if (existing.length === 0) {
			await api.database.insert("lists", {
				name: INBOX_LIST_NAME,
				sort_order: 0,
				created_at: new Date().toISOString(),
			});
		}
	}
}

export const taskManagerService = new TaskManagerService();

export function getTaskManagerApi(): PluginAPI | null {
	return taskManagerService.api;
}
