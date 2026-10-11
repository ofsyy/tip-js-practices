import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Кнопка с вложенной подписью: <button type="button" data-action="..."><span class="action-label">
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

export function createTaskElement(task) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed);

  // Название выводится только как текст: разметка в строке не интерпретируется.
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority];

  const toggleButton = createActionButton("toggle", "Выполнена");
  toggleButton.setAttribute("aria-pressed", String(task.completed));

  const deleteButton = createActionButton("delete", "Удалить");

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(toggleButton, deleteButton);

  card.append(title, status, priority, actions);
  return card;
}

export function renderTaskList(listElement, tasks) {
  // Заменяются только дочерние карточки, сам ul с обработчиком остаётся.
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // tasks — весь текущий массив, visibleCount — длина отфильтрованной выборки.
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const values = {
    total: String(total),
    completed: String(completed),
    pending: String(pending),
    progress: `${progress.toFixed(1)}%`,
    visible: String(visibleCount),
  };

  for (const [name, value] of Object.entries(values)) {
    const node = summaryElement.querySelector(`[data-stat="${name}"]`);
    if (node !== null) {
      node.textContent = value;
    }
  }
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }

  messageElement.textContent = total === 0
    ? "Список задач пуст."
    : "Нет задач по выбранному фильтру.";
  messageElement.hidden = false;
}
