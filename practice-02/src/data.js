// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 7: подготовка учебного релиза.
// По условию варианта изначально выполнены первые 6 задач, то есть все.
export const variantNumber = 7;
export const variantTasks = [
  { id: 11, title: "Зафиксировать список изменений релиза", completed: true, priority: "high" },
  { id: 23, title: "Обновить номер версии", completed: true, priority: "medium" },
  { id: 37, title: "Прогнать проверочные сценарии", completed: true, priority: "high" },
  { id: 41, title: "Обновить инструкцию запуска", completed: true, priority: "medium" },
  { id: 58, title: "Проверить отсутствие секретов в репозитории", completed: true, priority: "low" },
  { id: 64, title: "Создать тег релиза в Git", completed: true, priority: "low" },
];