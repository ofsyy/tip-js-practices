// Прикладная логика работы со списком задач.
// Функции не выводят данные и не меняют переданные массивы и объекты:
// для ожидаемых ошибок возвращается { ok: false, error: "..." }.

const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// Возвращает текст ошибки или null, если id корректен.
function validateId(id) {
  if (typeof id !== "number") {
    return "Идентификатор должен быть числом";
  }
  if (!Number.isSafeInteger(id) || id <= 0) {
    return "Идентификатор должен быть положительным целым числом";
  }
  return null;
}

// Проверяет название и возвращает очищенную от краевых пробелов строку.
function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Название не должно быть длиннее ${MAX_TITLE_LENGTH} символов` };
  }
  return { ok: true, title: trimmed };
}

// Возвращает текст ошибки или null, если приоритет допустим.
function validatePriority(priority) {
  if (typeof priority !== "string") {
    return "Приоритет должен быть строкой";
  }
  if (!PRIORITIES.includes(priority)) {
    return `Приоритет должен быть одним из: ${PRIORITIES.join(", ")}`;
  }
  return null;
}

export function createTask(id, title, priority = "medium") {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return { ok: false, error: titleResult.error };
  }

  const priorityError = validatePriority(priority);
  if (priorityError !== null) {
    return { ok: false, error: priorityError };
  }

  return {
    ok: true,
    task: { id, title: titleResult.title, completed: false, priority },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  let completed = 0;

  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }

  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус выполнения должен быть true или false" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // Новый объект создаётся только для выбранной задачи, остальные переиспользуются.
  const updated = tasks.map((task) => (task.id === id ? { ...task, completed } : task));
  return { ok: true, tasks: updated };
}

export function renameTask(tasks, id, title) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return { ok: false, error: titleResult.error };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updated = tasks.map((task) =>
    task.id === id ? { ...task, title: titleResult.title } : task,
  );
  return { ok: true, tasks: updated };
}

export function removeTask(tasks, id) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
