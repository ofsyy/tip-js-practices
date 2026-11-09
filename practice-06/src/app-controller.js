import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

const API_METHODS = [
  "loadInitialData", "getTasks", "createTask", "updateTask",
  "setTaskCompleted", "deleteTask", "resetDemoData",
];
const VIEW_METHODS = [
  "setListState", "setTasks", "setCategories", "setTotal",
  "setFormTask", "showFormErrors", "setMutationPending", "notify",
];

function requireMethods(object, names, label) {
  if (!object || typeof object !== "object") throw new TypeError(`${label} должен быть объектом`);
  for (const name of names) {
    if (typeof object[name] !== "function") throw new TypeError(`${label}.${name} должен быть функцией`);
  }
}

function isAbort(error) {
  return error instanceof ApiError && error.kind === "aborted";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, API_METHODS, "api");
  requireMethods(view, VIEW_METHODS, "view");
  if (typeof validateDraft !== "function") throw new TypeError("validateDraft должен быть функцией");

  // Снимок последнего ответа сервера; источник истины — API.
  let tasks = [];
  let categories = [];
  let categoriesLoaded = false;
  let filters = {};
  let editingId = null;
  let activeController = null; // AbortController текущей загрузки
  let loadSequence = 0;        // номер последней запущенной загрузки

  function showTasks(nextTasks, meta) {
    tasks = nextTasks;
    view.setTasks(tasks, categories);
    view.setTotal(meta?.total ?? tasks.length);
    view.setListState(tasks.length > 0 ? "ready" : "empty");
  }

  // Общая загрузка: отменяет предыдущую, применяет только самый свежий ответ.
  async function load() {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const sequence = ++loadSequence;
    const requestFilters = { ...filters };
    view.setListState("loading");

    try {
      if (!categoriesLoaded) {
        const result = await api.loadInitialData(requestFilters, { signal: controller.signal });
        if (sequence !== loadSequence) return; // устаревший ответ
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
        showTasks(result.tasks, result.meta);
      } else {
        const result = await api.getTasks(requestFilters, { signal: controller.signal });
        if (sequence !== loadSequence) return;
        showTasks(result.tasks, result.meta);
      }
    } catch (error) {
      if (sequence !== loadSequence) return;
      if (isAbort(error)) return; // отмена — управление потоком, а не ошибка пользователя
      view.setTotal(0);
      view.setListState("error", messageForError(error));
    } finally {
      if (activeController === controller) activeController = null;
    }
  }

  // Общая схема изменения: блокировка → запрос → повторный GET → разблокировка.
  async function mutate(operation, successMessage) {
    view.setMutationPending(true);
    try {
      await operation();
      view.notify(successMessage, "success");
      await load();
      return { ok: true, error: null };
    } catch (error) {
      if (!isAbort(error)) view.notify(messageForError(error), "error");
      return { ok: false, error };
    } finally {
      view.setMutationPending(false);
    }
  }

  function findTask(id) {
    return tasks.find((task) => task.id === id);
  }

  async function start(initialFilters = {}) {
    filters = { ...initialFilters };
    editingId = null;
    view.setFormTask(null);
    await load();
  }

  async function applyFilters(nextFilters = {}) {
    filters = { ...nextFilters };
    await load();
  }

  async function refresh() {
    await load();
  }

  async function submit(draft) {
    const result = validateDraft(draft, categories);
    view.showFormErrors(result.errors);
    if (!result.valid) {
      view.notify("Исправьте ошибки в форме.", "error");
      return false;
    }
    const id = editingId;
    const { ok, error } = await mutate(
      () => (id === null ? api.createTask(result.value) : api.updateTask(id, result.value)),
      id === null ? "Задача создана на сервере." : `Задача № ${id} изменена.`,
    );
    if (ok) {
      editingId = null;
      view.setFormTask(null);
    } else if (error instanceof ApiError && error.code === "VALIDATION_ERROR" && error.details) {
      // Серверная проверка отклонила поля — показываем её сообщения рядом с формой.
      view.showFormErrors(error.details);
    }
    return ok;
  }

  function beginEdit(id) {
    const task = findTask(id);
    if (!task) {
      view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
      return false;
    }
    editingId = id;
    view.showFormErrors({});
    view.setFormTask(task);
    return true;
  }

  function cancelEdit() {
    editingId = null;
    view.showFormErrors({});
    view.setFormTask(null);
  }

  async function toggleTask(id) {
    const task = findTask(id);
    if (!task) {
      view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
      return false;
    }
    const next = !task.completed;
    const { ok } = await mutate(
      () => api.setTaskCompleted(id, next),
      next ? `Задача № ${id} отмечена выполненной.` : `Задача № ${id} возвращена в работу.`,
    );
    return ok;
  }

  async function deleteTask(id) {
    const { ok } = await mutate(() => api.deleteTask(id), `Задача № ${id} удалена.`);
    if (ok && editingId === id) cancelEdit();
    return ok;
  }

  async function resetData() {
    const { ok } = await mutate(() => api.resetDemoData(), "Исходные данные восстановлены.");
    if (ok) cancelEdit();
    return ok;
  }

  function destroy() {
    activeController?.abort();
    activeController = null;
    loadSequence += 1;
  }

  return {
    start, applyFilters, refresh, submit, beginEdit, cancelEdit,
    toggleTask, deleteTask, resetData, destroy,
  };
}
