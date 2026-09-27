"use strict";

// Задание 3. Сводка выполнения задач.
// Вариант: 1. totalTasks = 12, completedTasks = 5.

const totalTasks = 12;
const completedTasks = 5;

// 1. Проверка типа и целочисленности
const isTotalValid =
  typeof totalTasks === "number" &&
  Number.isInteger(totalTasks) &&
  Number.isFinite(totalTasks) &&
  totalTasks >= 0 &&
  totalTasks <= 1000;

const isCompletedValid =
  typeof completedTasks === "number" &&
  Number.isInteger(completedTasks) &&
  Number.isFinite(completedTasks) &&
  completedTasks >= 0 &&
  completedTasks <= totalTasks;

if (!isTotalValid || !isCompletedValid) {
  // 2. Одно понятное сообщение об ошибке, без обычной сводки
  if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
    console.log("Ошибка: количество задач должно быть числом, а не строкой.");
  } else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
    console.log("Ошибка: недопустимое числовое значение (NaN или Infinity).");
  } else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: количество задач должно быть целым числом.");
  } else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: количество задач не может быть отрицательным.");
  } else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница (1000 задач).");
  } else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше задач, чем существует.");
  } else {
    console.log("Ошибка: недопустимые входные данные.");
  }
} else if (totalTasks === 0) {
  // 3. Особый случай: задач нет, процент не считаем
  console.log("Задач пока нет");
} else {
  // 4. Обычная сводка
  const remainingTasks = totalTasks - completedTasks;
  const percentage = (completedTasks / totalTasks) * 100;

  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percentage.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}