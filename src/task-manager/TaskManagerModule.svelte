<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";
	import {
		Badge,
		Button,
		Checkbox,
		EmptyState,
		TextInput,
	} from "phoundry-ui";
	import {
		DATE_FORMAT_RELATIVE,
		INBOX_LIST_NAME,
		PRIORITY_OPTIONS,
	} from "./task-manager.data";
	import {
		formatDueDate,
		priorityBadgeVariant,
		priorityLabel,
	} from "./task-manager.logic";
	import { getTaskManagerApi, taskManagerService } from "./task-manager.svelte";

	let { moduleInstance }: ModuleProviderProps = $props();

	let newTaskTitle = $state("");
	let addInputEl = $state<HTMLInputElement | undefined>(undefined);

	const activeList = $derived(
		taskManagerService.lists.find((list) => list.id === taskManagerService.activeListId) ??
			null,
	);

	const dateFormat = $derived(
		(getTaskManagerApi()?.settings.get<string>("dateFormat") as TaskDateFormat | undefined) ??
			DATE_FORMAT_RELATIVE,
	);

	onMount(() => {
		const saved = moduleInstance.state as TaskManagerModuleState | undefined;
		if (saved?.activeListId) {
			taskManagerService.activeListId = saved.activeListId;
		}

		taskManagerService.setFocusAddHandler(() => {
			addInputEl?.focus();
		});

		void taskManagerService.initialize();

		return () => {
			taskManagerService.setFocusAddHandler(null);
			moduleInstance.state = {
				activeListId: taskManagerService.activeListId,
			} satisfies TaskManagerModuleState;
		};
	});

	async function handleAddTask(): Promise<void> {
		const title = newTaskTitle;
		newTaskTitle = "";
		await taskManagerService.addTask(title);
	}

	async function handleCreateList(): Promise<void> {
		const api = getTaskManagerApi();
		if (!api) {
			return;
		}

		const name = await api.modal.prompt({
			title: "New list",
			message: "List name",
			placeholder: "Work, Personal…",
		});

		if (name) {
			await taskManagerService.createList(name);
		}
	}

	async function handleDeleteList(listId: number): Promise<void> {
		const api = getTaskManagerApi();
		if (!api) {
			return;
		}

		const list = taskManagerService.lists.find((entry) => entry.id === listId);
		if (!list || list.name === INBOX_LIST_NAME) {
			return;
		}

		const confirmed = await api.modal.confirm({
			title: "Delete list",
			message: `Delete “${list.name}” and all of its tasks?`,
			confirmLabel: "Delete",
			danger: true,
		});

		if (confirmed) {
			await taskManagerService.deleteList(listId);
		}
	}
</script>

<div class="tm-root">
	<aside class="tm-lists">
		<div class="tm-lists-header">
			<span class="tm-section-label">Lists</span>
			<Button variant="ghost" size="sm" icon="mdi:plus" onclick={handleCreateList}>
				New
			</Button>
		</div>

		<ul class="tm-list-items">
			{#each taskManagerService.lists as list (list.id)}
				<li>
					<button
						type="button"
						class="tm-list-btn"
						class:active={list.id === taskManagerService.activeListId}
						onclick={() => void taskManagerService.selectList(list.id)}
					>
						<Icon icon="mdi:format-list-bulleted" width={16} />
						<span class="truncate">{list.name}</span>
					</button>
					{#if list.name !== INBOX_LIST_NAME}
						<button
							type="button"
							class="tm-list-delete"
							aria-label="Delete list"
							onclick={() => void handleDeleteList(list.id)}
						>
							<Icon icon="mdi:close" width={14} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</aside>

	<section class="tm-main">
		<header class="tm-main-header">
			<h2 class="tm-title">{activeList?.name ?? "Tasks"}</h2>
		</header>

		<form
			class="tm-add"
			onsubmit={(event) => {
				event.preventDefault();
				void handleAddTask();
			}}
		>
			<TextInput
				bind:element={addInputEl}
				value={newTaskTitle}
				oninput={(value) => (newTaskTitle = value)}
				placeholder="Add a task…"
				size="sm"
			/>
			<Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>Add</Button>
		</form>

		{#if taskManagerService.loading}
			<div class="tm-loading">Loading…</div>
		{:else if taskManagerService.sortedTasks.length === 0}
			<EmptyState
				icon="mdi:checkbox-marked-circle-outline"
				title="No tasks"
				description="Add a task to get started."
				size="sm"
			/>
		{:else}
			<ul class="tm-tasks">
				{#each taskManagerService.sortedTasks as task (task.id)}
					<li class="tm-task" class:completed={!!task.completed}>
						<Checkbox
							checked={!!task.completed}
							onchange={() => void taskManagerService.toggleTaskCompleted(task.id)}
						/>
						<div class="tm-task-body">
							<span class="tm-task-title">{task.title}</span>
							<div class="tm-task-meta">
								<Badge variant={priorityBadgeVariant(task.priority)} size="sm">
									{priorityLabel(task.priority)}
								</Badge>
								{#if task.due_date}
									<span class="tm-due">{formatDueDate(task.due_date, dateFormat)}</span>
								{/if}
							</div>
						</div>
						<div class="tm-task-actions">
							<select
								class="tm-select"
								aria-label="Priority"
								value={String(task.priority)}
								onchange={(event) => {
									const value = event.currentTarget.value;
									void taskManagerService.updateTaskPriority(
										task.id,
										Number(value) as TaskPriority,
									);
								}}
							>
								{#each PRIORITY_OPTIONS as option (option.value)}
									<option value={String(option.value)}>{option.label}</option>
								{/each}
							</select>
							<input
								type="date"
								class="tm-date-input"
								aria-label="Due date"
								value={task.due_date ?? ""}
								onchange={(event) => {
									const value = event.currentTarget.value;
									void taskManagerService.updateTaskDueDate(
										task.id,
										value ? value : null,
									);
								}}
							/>
							<Button
								variant="ghost"
								size="sm"
								icon="mdi:delete-outline"
								aria-label="Delete task"
								onclick={() => void taskManagerService.deleteTask(task.id)}
							/>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.tm-root {
		display: flex;
		height: 100%;
		min-height: 0;
		background: var(--surface-1);
		color: var(--text-primary);
	}

	.tm-lists {
		display: flex;
		width: 9.5rem;
		flex-shrink: 0;
		flex-direction: column;
		border-right: 1px solid var(--border-muted);
		background: var(--surface-2);
	}

	.tm-lists-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.5rem 0.25rem;
	}

	.tm-section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-tertiary);
	}

	.tm-list-items {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.125rem;
		overflow: auto;
		padding: 0.25rem;
		list-style: none;
	}

	.tm-list-items li {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.tm-list-btn {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
		padding: 0.375rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		text-align: left;
		cursor: pointer;
	}

	.tm-list-btn:hover,
	.tm-list-btn.active {
		background: var(--surface-3);
		color: var(--text-primary);
	}

	.tm-list-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		opacity: 0;
	}

	.tm-list-items li:hover .tm-list-delete,
	.tm-list-delete:focus-visible {
		opacity: 1;
	}

	.tm-list-delete:hover {
		color: var(--text-danger, #e35);
		background: var(--surface-3);
	}

	.tm-main {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		padding: 0.75rem;
		gap: 0.75rem;
	}

	.tm-main-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tm-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.tm-add {
		display: flex;
		gap: 0.5rem;
	}

	.tm-add :global(input) {
		flex: 1;
	}

	.tm-loading {
		padding: 1rem 0;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
	}

	.tm-tasks {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.375rem;
		overflow: auto;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.tm-task {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid var(--border-muted);
		border-radius: 0.5rem;
		background: var(--surface-2);
	}

	.tm-task.completed .tm-task-title {
		text-decoration: line-through;
		color: var(--text-tertiary);
	}

	.tm-task-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.tm-task-title {
		font-size: 0.875rem;
		line-height: 1.3;
		word-break: break-word;
	}

	.tm-task-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
	}

	.tm-due {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.tm-task-actions {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.25rem;
	}

	.tm-select,
	.tm-date-input {
		height: 1.75rem;
		padding: 0 0.375rem;
		border: 1px solid var(--border-muted);
		border-radius: 0.375rem;
		background: var(--surface-1);
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.tm-date-input {
		color-scheme: dark light;
	}
</style>
