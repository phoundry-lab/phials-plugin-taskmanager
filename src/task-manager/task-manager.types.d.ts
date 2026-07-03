type TaskPriority = 0 | 1 | 2;

type TaskSortKey = "due_date" | "priority" | "created";

type TaskDateFormat = "relative" | "absolute";

interface TaskListRow {
	id: number;
	name: string;
	sort_order: number;
	created_at: string;
}

interface TaskRow {
	id: number;
	list_id: number;
	title: string;
	completed: number;
	priority: TaskPriority;
	due_date: string | null;
	created_at: string;
	sort_order: number;
}

interface TaskManagerModuleState {
	activeListId: number | null;
}
