export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Проверяет и нормализует базовый адрес: абсолютный http(s), без query и hash.
function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой");
  }
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new TypeError(`baseUrl должен быть абсолютным адресом: ${baseUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError(`baseUrl должен использовать http или https: ${baseUrl}`);
  }
  if (parsed.search !== "" || parsed.hash !== "" || baseUrl.includes("?") || baseUrl.includes("#")) {
    throw new TypeError("baseUrl не должен содержать query или hash");
  }
  return parsed;
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = normalizeBaseUrl(baseUrl);
  if (typeof path !== "string" || path.replace(/^\/+|\/+$/g, "") === "") {
    throw new TypeError("path должен быть непустым относительным путём");
  }
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть обычным объектом");
  }

  // Убираем лишние / на стыке, чтобы не получить двойной разделитель.
  const basePath = base.pathname.replace(/\/+$/, "");
  const relative = path.replace(/^\/+/, "");
  const url = new URL(`${basePath}/${relative}`, base.origin);

  for (const [name, value] of Object.entries(query)) {
    // false и 0 — содержательные значения; пропускаются только пустые.
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  return url.toString();
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

// Перенесено из ПР5 и расширено методами и JSON-телом.
// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl).toString();
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом");
  }

  async function requestJson(path, {
    method = "GET",
    query = {},
    body,
    signal,
    timeoutMs: requestTimeout = timeoutMs,
  } = {}) {
    const normalizedMethod = typeof method === "string" ? method.toUpperCase() : "";
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      throw new TypeError(`Метод ${method} не поддерживается: допустимы GET, POST, PATCH, DELETE`);
    }
    if (normalizedMethod === "GET" && body !== undefined) {
      throw new TypeError("GET-запрос не может иметь тело");
    }
    const url = buildUrl(normalizedBase, path, query);
    if (!Number.isSafeInteger(requestTimeout) || requestTimeout <= 0) {
      throw new TypeError("timeoutMs должен быть положительным целым числом");
    }

    // Content-Type добавляется только при наличии тела: лишний заголовок
    // неверно описывает запрос и вызывает лишний CORS preflight.
    const headers = { Accept: "application/json" };
    const init = { method: normalizedMethod, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    // Тайм-аут и внешний сигнал объединяются: fetch отменяется по любому из них.
    const timeoutSignal = AbortSignal.timeout(requestTimeout);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    // 1. Сетевой этап — отдельный try: сюда попадает только отказ самого fetch.
    let response;
    try {
      response = await fetchFn(url, { ...init, signal: combinedSignal });
    } catch (error) {
      if (signal?.aborted) {
        throw new ApiError("Запрос отменён вызывающим кодом.", { kind: "aborted", url, cause: error });
      }
      if (timeoutSignal.aborted) {
        throw new ApiError(`Превышено время ожидания ответа (${requestTimeout} мс).`, {
          kind: "timeout", url, cause: error,
        });
      }
      throw new ApiError("Не удалось получить ответ от сервера (сетевая ошибка).", {
        kind: "network", url, cause: error,
      });
    }

    // 2. Обработка полученного ответа — уже вне сетевого try.
    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул значение, не являющееся Response.", { kind: "invalid-response", url });
    }

    if (!response.ok) {
      const payload = await readJsonSafely(response);
      const apiError = payload && typeof payload === "object" ? payload.error : null;
      throw new ApiError(
        typeof apiError?.message === "string" && apiError.message !== ""
          ? apiError.message
          : `Сервер вернул HTTP ${response.status}.`,
        {
          kind: "http",
          status: response.status,
          code: typeof apiError?.code === "string" ? apiError.code : null,
          details: apiError?.details ?? null,
          url,
        },
      );
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError(`Ожидался JSON, получен Content-Type «${contentType || "не указан"}».`, {
        kind: "invalid-response", url,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Сервер вернул повреждённый JSON.", { kind: "invalid-response", url, cause: error });
    }
  }

  return { requestJson };
}
