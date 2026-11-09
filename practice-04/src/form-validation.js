const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

// Возвращает { id } либо { error } для значения id из формы.
// Значение FormData — строка, поэтому преобразование выполняется явно через Number.
// Пустая строка отклоняется отдельно: Number("") даёт 0, а не ошибку.
function parseDraftId(rawId) {
  if (typeof rawId === "string" && rawId.trim() === "") {
    return { error: "Укажите идентификатор задачи" };
  }
  if (typeof rawId !== "string" && typeof rawId !== "number") {
    return { error: "Идентификатор должен быть числом" };
  }
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { error: "Идентификатор должен быть положительным целым числом" };
  }
  return { id };
}

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;

  if (editingId === null) {
    // Режим создания: id берётся из формы и должен быть уникальным.
    const parsed = parseDraftId(draft.id);
    if (parsed.error) {
      errors.id = parsed.error;
    } else if (tasks.some((task) => task.id === parsed.id)) {
      errors.id = `Задача с id ${parsed.id} уже существует`;
    } else {
      id = parsed.id;
    }
  } else {
    // Режим редактирования: disabled-поле не попадает в FormData,
    // источник id — editingId; совпадение с самой задачей не дубликат.
    if (!Number.isSafeInteger(editingId) || editingId <= 0) {
      errors.id = "Некорректный идентификатор редактируемой задачи";
    } else if (!tasks.some((task) => task.id === editingId)) {
      errors.id = `Редактируемая задача с id ${editingId} не найдена`;
    } else {
      id = editingId;
    }
  }

  let title;
  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = "Название не должно быть пустым или состоять из пробелов";
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Название не должно быть длиннее ${MAX_TITLE_LENGTH} символов`;
    }
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: low, medium или high";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, title, priority: draft.priority } };
}
