const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
// DOM не читается, входные объекты не изменяются.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const source = draft ?? {};

  let title = "";
  if (typeof source.title !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = source.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов.";
    }
  }

  if (!ALLOWED_PRIORITIES.has(source.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  // Значение select — строка; пустая строка не превращается в 0.
  const rawCategory = source.categoryId;
  const categoryId = typeof rawCategory === "string" && rawCategory.trim() === ""
    ? NaN
    : Number(rawCategory);
  const known = Array.isArray(categories) && categories.some((category) => category.id === categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Выберите категорию.";
  } else if (!known) {
    errors.categoryId = "Такой категории нет в загруженном справочнике.";
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: valid ? { title, priority: source.priority, categoryId } : null,
    errors,
  };
}
