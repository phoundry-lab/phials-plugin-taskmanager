export const PLUGIN_ID = "phoundry.taskmanager";

export const INBOX_LIST_NAME = "Inbox";

export const PRIORITY_LOW = 0;
export const PRIORITY_MEDIUM = 1;
export const PRIORITY_HIGH = 2;

export const PRIORITY_OPTIONS = [
	{ value: PRIORITY_LOW, label: "Low" },
	{ value: PRIORITY_MEDIUM, label: "Medium" },
	{ value: PRIORITY_HIGH, label: "High" },
] as const;

export const SORT_DUE_DATE = "due_date";
export const SORT_PRIORITY = "priority";
export const SORT_CREATED = "created";

export const DATE_FORMAT_RELATIVE = "relative";
export const DATE_FORMAT_ABSOLUTE = "absolute";
