import {
	DATE_FORMAT_ABSOLUTE,
	DATE_FORMAT_RELATIVE,
	PRIORITY_HIGH,
	PRIORITY_LOW,
	PRIORITY_MEDIUM,
	SORT_CREATED,
	SORT_DUE_DATE,
	SORT_PRIORITY,
} from "./task-manager.data";

export function compareTasks(
	a: TaskRow,
	b: TaskRow,
	sortKey: TaskSortKey,
): number {
	if (a.completed !== b.completed) {
		return a.completed - b.completed;
	}

	switch (sortKey) {
		case SORT_PRIORITY:
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}
			break;
		case SORT_DUE_DATE: {
			const aDue = a.due_date ?? "9999-12-31";
			const bDue = b.due_date ?? "9999-12-31";
			if (aDue !== bDue) {
				return aDue.localeCompare(bDue);
			}
			break;
		}
		case SORT_CREATED:
		default:
			if (a.created_at !== b.created_at) {
				return a.created_at.localeCompare(b.created_at);
			}
			break;
	}

	return a.id - b.id;
}

export function priorityLabel(priority: TaskPriority): string {
	switch (priority) {
		case PRIORITY_HIGH:
			return "High";
		case PRIORITY_MEDIUM:
			return "Medium";
		case PRIORITY_LOW:
		default:
			return "Low";
	}
}

export function parseDueDateString(value: string | null): Date | null {
	if (!value) {
		return null;
	}

	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDueDateForStorage(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function priorityBadgeVariant(
	priority: TaskPriority,
): "default" | "warning" | "error" {
	switch (priority) {
		case PRIORITY_HIGH:
			return "error";
		case PRIORITY_MEDIUM:
			return "warning";
		case PRIORITY_LOW:
		default:
			return "default";
	}
}

export function formatDueDate(
	dueDate: string | null,
	format: TaskDateFormat,
	now = new Date(),
): string {
	if (!dueDate) {
		return "";
	}

	const date = new Date(`${dueDate}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		return dueDate;
	}

	if (format === DATE_FORMAT_ABSOLUTE) {
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	const today = startOfDay(now);
	const target = startOfDay(date);
	const diffDays = Math.round(
		(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays === 0) {
		return "Today";
	}
	if (diffDays === 1) {
		return "Tomorrow";
	}
	if (diffDays === -1) {
		return "Yesterday";
	}
	if (diffDays < -1) {
		return `${Math.abs(diffDays)} days ago`;
	}
	if (diffDays > 1 && diffDays <= 7) {
		return `In ${diffDays} days`;
	}

	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isRelativeDateFormat(format: string): format is TaskDateFormat {
	return format === DATE_FORMAT_RELATIVE || format === DATE_FORMAT_ABSOLUTE;
}
