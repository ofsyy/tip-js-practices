"use strict";

// Задание 4. План выполнения задач по дням.
// Вариант: 1. totalTasks = 12, completedTasks = 5, dailyLimit = 3.

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

// 1. Проверка totalTasks и completedTasks (как в задании 3)
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

// 2. Проверка dailyLimit
const isDailyLimitValid =
  typeof dailyLimit === "number" &&
  Number.isInteger(dailyLimit) &&
  Number.isFinite(dailyLimit) &&
  dailyLimit >= 1 &&
  dailyLimit <= 1000;

// 3. Сообщение об ошибке и выход
if (!isTotalValid || !isCompletedValid || !isDailyLimitValid) {
  if (typeof totalTasks !== "number" || typeof completedTasks !== "number" || typeof dailyLimit !== "number") {
    console.log("Ошибка: все входные значения должны быть числами, а не строками.");
  } else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks) || !Number.isFinite(dailyLimit)) {
    console.log("Ошибка: недопустимое числовое значение (NaN или Infinity).");
  } else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit)) {
    console.log("Ошибка: количество задач и дневная норма должны быть целыми числами.");
  } else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: количество задач не может быть отрицательным.");
  } else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница (1000 задач).");
  } else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше задач, чем существует.");
  } else if (dailyLimit < 1 || dailyLimit > 1000) {
    console.log("Ошибка: дневная норма должна быть в диапазоне от 1 до 1000.");
  } else {
    console.log("Ошибка: недопустимые входные данные.");
  }
} else {
  // 4. Обычная работа
  let remaining = totalTasks - completedTasks;

  if (remaining === 0) {
    console.log("Все задачи уже выполнены.");
    console.log("Потребуется дней: 0");
  } else {
    console.log(`Осталось задач: ${remaining}`);

    let day = 0;

    while (remaining > 0) {
      day += 1;
      const tasksToday = Math.min(dailyLimit, remaining);
      remaining -= tasksToday;
      console.log(`День ${day}: выполнено ${tasksToday}, осталось ${remaining}`);
    }

    console.log(`Потребуется дней: ${day}`);
  }
}