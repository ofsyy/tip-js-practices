import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Проверяет фильтры до запроса. Возвращает новый объект только с допустимыми полями.
function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть обычным объектом");
  }
  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}`);
    if (value === undefined) continue;
    if (name === "completed") {
      if (typeof value !== "boolean") throw new TypeError("completed должен быть true или false");
      query.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) throw new TypeError("priority должен быть low, medium или high");
      query.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) throw new TypeError("categoryId должен быть положительным целым числом");
      query.categoryId = value;
    } else {
      if (typeof value !== "string") throw new TypeError("q должен быть строкой");
      const q = value.trim();
      if (q.length > 100) throw new TypeError("q должен быть не длиннее 100 символов");
      if (q !== "") query.q = q;
    }
  }
  return query;
}

function requireId(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("id задачи должен быть положительным целым числом");
}

function readCollection(payload, isItem, label) {
  if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw invalidResponse(`Ответ ${label}: поле data должно быть массивом.`);
  }
  if (!payload.data.every(isItem)) throw invalidResponse(`Ответ ${label}: элемент не соответствует схеме.`);
  if (new Set(payload.data.map((item) => item.id)).size !== payload.data.length) {
    throw invalidResponse(`Ответ ${label}: повторяющиеся id.`);
  }
  if (payload.meta === null || typeof payload.meta !== "object" || payload.meta.total !== payload.data.length) {
    throw invalidResponse(`Ответ ${label}: meta.total не совпадает с длиной data.`);
  }
  return payload.data;
}

function readTask(payload) {
  if (payload === null || typeof payload !== "object" || !isTask(payload.data)) {
    throw invalidResponse("Ответ задачи не соответствует схеме.");
  }
  return payload.data;
}

// Копирует только поля, которые клиент вправе отправить; id и completed назначает сервер.
function pickFields(source, names) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    throw new TypeError("Данные задачи должны быть объектом");
  }
  const result = {};
  for (const name of names) {
    if (source[name] !== undefined) result[name] = source[name];
  }
  return result;
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает клиент с методом requestJson");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    const tasks = readCollection(payload, isTask, "задач");
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, { signal } = {}) {
    requireId(id);
    return readTask(await client.requestJson(`/tasks/${id}`, { signal }));
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return readCollection(payload, isCategory, "категорий");
  }

  async function loadInitialData(filters = {}, options = {}) {
    // Оба запроса начинаются до общего ожидания.
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  async function createTask(draft, { signal } = {}) {
    const body = pickFields(draft, ["title", "priority", "categoryId"]);
    return readTask(await client.requestJson("/tasks", { method: "POST", body, signal }));
  }

  async function updateTask(id, changes, { signal } = {}) {
    requireId(id);
    const body = pickFields(changes, ["title", "priority", "categoryId", "completed"]);
    if (Object.keys(body).length === 0) throw new TypeError("Нет изменяемых полей");
    return readTask(await client.requestJson(`/tasks/${id}`, { method: "PATCH", body, signal }));
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    requireId(id);
    if (typeof completed !== "boolean") throw new TypeError("completed должен быть true или false");
    return readTask(await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { completed },
      signal,
    }));
  }

  async function deleteTask(id, { signal } = {}) {
    requireId(id);
    const payload = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    if (payload !== null) throw invalidResponse("Ожидался ответ 204 без тела.");
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = payload?.data;
    if (!data || data.reset !== true || !Number.isSafeInteger(data.total)) {
      throw invalidResponse("Сервер не подтвердил восстановление данных.");
    }
    return data;
  }

  return {
    getTasks, getTaskById, getCategories, loadInitialData,
    createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData,
  };
}
