const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  const text = document.createElement("span");
  text.className = "action-label";
  text.textContent = label;
  button.append(text);
  return button;
}

function createMeta(className, text) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = text;
  return node;
}

// Данные сервера считаются недоверенными: только textContent, без innerHTML.
export function createTaskElement(task, category) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed);

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.append(
    createMeta("task-status", task.completed ? "Выполнена" : "В работе"),
    createMeta("task-priority", PRIORITY_LABELS[task.priority] ?? task.priority),
    createMeta("task-category", category?.name ?? "Неизвестная категория"),
  );

  const toggle = createActionButton("toggle", task.completed ? "Вернуть в работу" : "Выполнена");
  toggle.setAttribute("aria-pressed", String(task.completed));
  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(toggle, createActionButton("edit", "Изменить"), createActionButton("delete", "Удалить"));

  card.append(title, meta, actions);
  return card;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
