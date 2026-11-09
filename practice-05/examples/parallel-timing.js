// Временный эксперимент задания 7: последовательное ожидание против Promise.all.
// Два независимых запроса к /debug/delay по 300 мс, каждый сценарий — три раза.
import { createApiClient } from "../src/api-client.js";

const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl, timeoutMs: 3000 });
const delay = () => client.requestJson("/debug/delay", { query: { ms: 300 } });

async function sequential() {
  const startedAt = performance.now();
  await delay();
  await delay();
  return performance.now() - startedAt;
}

async function parallel() {
  const startedAt = performance.now();
  const first = delay();
  const second = delay();
  await Promise.all([first, second]);
  return performance.now() - startedAt;
}

for (const [name, run] of [["Последовательно", sequential], ["Promise.all", parallel]]) {
  const times = [];
  for (let i = 0; i < 3; i += 1) times.push((await run()).toFixed(1));
  console.log(`${name}: ${times.join(" мс, ")} мс`);
}
