// Собственные проверки ПР5 (вариант 7). API запускается на временном порту.
import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
  try {
    await action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.stack ?? error.message);
  }
}

async function catchError(action) {
  try {
    await action();
  } catch (error) {
    return error;
  }
  throw new Error("Ожидалась ошибка");
}

const server = createApiServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
  await check("01. Вариант 7: q=провер кодируется и даёт id [7, 16]", async () => {
    const url = buildUrl(baseUrl, "/tasks", variantFilters);
    assert.ok(url.endsWith("/tasks?q=%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80"));
    const { tasks, meta } = await api.getTasks(variantFilters);
    assert.deepEqual(tasks.map((task) => task.id), [7, 16]);
    assert.equal(meta.total, 2);
    assert.equal(meta.filters.q, "провер");
  });

  await check("02. Комбинация q + completed=false + categoryId=1 сужает вариант до [7]", async () => {
    const { tasks, meta } = await api.getTasks({ q: "  провер ", completed: false, categoryId: 1 });
    assert.deepEqual(tasks.map((task) => task.id), [7]);
    assert.deepEqual(meta.filters, { completed: false, priority: null, categoryId: 1, q: "провер" });
  });

  await check("03. Повтор параметра и completed=yes → http 400 INVALID_QUERY", async () => {
    // Через getTasks такой запрос не собрать — используем общий клиент и URL с повтором.
    const response = await fetch(`${baseUrl}/tasks?priority=high&priority=low`);
    assert.equal(response.status, 400);
    const error = await catchError(() => client.requestJson("/tasks", { query: { completed: "yes" } }));
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "http");
    assert.equal(error.status, 400);
    assert.equal(error.code, "INVALID_QUERY");
  });

  await check("04. Неизвестная категория /categories/99 → http 404 с кодом API", async () => {
    const error = await catchError(() => client.requestJson("/categories/99"));
    assert.equal(error.kind, "http");
    assert.equal(error.status, 404);
    assert.equal(typeof error.code, "string");
  });

  await check("05. Граница тайм-аута: задержка 50 мс укладывается в 300 мс, 400 мс — нет", async () => {
    const ok = await client.requestJson("/debug/delay", { query: { ms: 50 }, timeoutMs: 300 });
    assert.equal(typeof ok, "object");
    const error = await catchError(
      () => client.requestJson("/debug/delay", { query: { ms: 400 }, timeoutMs: 300 }),
    );
    assert.equal(error.kind, "timeout");
  });

  await check("06. Уже отменённый сигнал даёт aborted до получения ответа", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await catchError(() => client.requestJson("/health", { signal: controller.signal }));
    assert.equal(error.kind, "aborted");
  });

  await check("07. Длина q: 100 символов допустима, 101 отклоняется до запроса", async () => {
    const result = await api.getTasks({ q: "я".repeat(100) });
    assert.deepEqual(result.tasks, []);
    await assert.rejects(() => api.getTasks({ q: "я".repeat(101) }), TypeError);
  });
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
