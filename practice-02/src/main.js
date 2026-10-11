import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// Вспомогательные функции отвечают только за вывод.
// Все вычисления выполняются функциями из task-service.js.

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const progressText = total === 0 ? "Задач пока нет" : `прогресс: ${progress.toFixed(1)}%`;
  console.log(`${label}: всего ${total}; выполнено ${completed}; осталось ${pending}; ${progressText}`);
}

function printIds(label, tasks) {
  console.log(`${label}: [${tasks.map((task) => task.id).join(", ")}]`);
}

// Возвращает новое состояние при успехе и прежнее — при ошибке.
function applyResult(label, currentTasks, result) {
  if (result.ok) {
    console.log(`\n${label}: выполнено`);
    printStats("Сводка", result.tasks);
    return result.tasks;
  }
  console.log(`\n${label}: отказ`);
  console.error(`Ошибка: ${result.error}`);
  printStats("Сводка без изменений", currentTasks);
  return currentTasks;
}

function printInitial(tasks) {
  console.table(tasks);
  console.log("Названия:", getTaskTitles(tasks));
  printIds("Невыполненные задачи (id)", getPendingTasks(tasks));
  printStats("Сводка", tasks);
}

// ---------- Общий сценарий ----------

console.log("=== Общий сценарий (demoTasks) ===");

// Снимок исходных данных, чтобы в конце убедиться, что они не изменились.
const demoSnapshot = JSON.stringify(demoTasks);
let currentTasks = demoTasks;

printInitial(currentTasks);

const found = findTaskById(currentTasks, 4);
console.log("Поиск id 4:", found === undefined ? "не найдено" : found.title);
console.log("Поиск id 777:", findTaskById(currentTasks, 777));

const created = createTask(30, "  Пример отдельного создания  ");
console.log("createTask(30, ...):", created.ok ? created.task : created.error);

currentTasks = applyResult(
  "Добавление id 20",
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high"),
);
currentTasks = applyResult(
  "Выполнение id 4",
  currentTasks,
  setTaskCompleted(currentTasks, 4, true),
);
currentTasks = applyResult(
  "Переименование id 10",
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
);
currentTasks = applyResult("Удаление id 7", currentTasks, removeTask(currentTasks, 7));

// Обработка отказов: состояние после них не меняется.
currentTasks = applyResult(
  "Повторное добавление id 20",
  currentTasks,
  addTask(currentTasks, 20, "Дубликат"),
);
currentTasks = applyResult(
  'Статус "true" строкой для id 4',
  currentTasks,
  setTaskCompleted(currentTasks, 4, "true"),
);
currentTasks = applyResult(
  "Удаление отсутствующей задачи id 777",
  currentTasks,
  removeTask(currentTasks, 777),
);

console.log("\nИтоговый список:");
console.table(currentTasks);
printIds("Идентификаторы", currentTasks);
printIds("Невыполненные задачи (id)", getPendingTasks(currentTasks));
printStats("Итоговая сводка", currentTasks);

console.log("demoTasks не изменился:", JSON.stringify(demoTasks) === demoSnapshot);
printStats("Сводка demoTasks", demoTasks);

// ---------- Индивидуальный вариант ----------

console.log(`\n=== Вариант ${variantNumber} (variantTasks) ===`);

const variantSnapshot = JSON.stringify(variantTasks);
let variantState = variantTasks;

printInitial(variantState);

variantState = applyResult(
  "Добавление id 80",
  variantState,
  addTask(variantState, 80, "Опубликовать релиз на GitHub", "high"),
);
variantState = applyResult(
  "Выполнение id 11",
  variantState,
  setTaskCompleted(variantState, 11, true),
);
variantState = applyResult(
  "Переименование id 23",
  variantState,
  renameTask(variantState, 23, "Обновить номер версии в package.json"),
);
variantState = applyResult("Удаление id 37", variantState, removeTask(variantState, 37));
variantState = applyResult(
  "Повторное добавление id 80",
  variantState,
  addTask(variantState, 80, "Опубликовать релиз повторно", "high"),
);

console.log("\nИтоговый список варианта:");
console.table(variantState);
printIds("Идентификаторы", variantState);
printStats("Итоговая сводка", variantState);

console.log("variantTasks не изменился:", JSON.stringify(variantTasks) === variantSnapshot);
printStats("Сводка variantTasks", variantTasks);
