(function () {
  const form = document.getElementById("brief");
  const actionsRoot = document.getElementById("actions");
  const addButton = document.getElementById("add-action");
  const countNode = document.getElementById("action-count");
  const result = document.getElementById("result");
  const statusNode = document.getElementById("result-status");
  const formAlert = document.getElementById("form-alert");

  let actionSeq = 0;

  function addAction(value) {
    actionSeq += 1;
    const id = "action-" + actionSeq;
    const row = document.createElement("div");
    row.className = "action-row";

    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = "action";
    input.autocomplete = "off";
    input.placeholder = "Например, «Добавить товар в список»";
    input.value = value || "";
    input.addEventListener("input", updateCount);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "action-remove";
    remove.textContent = "Удалить";
    remove.addEventListener("click", function () {
      if (actionsRoot.children.length === 1) return;
      row.remove();
      refreshActionLabels();
      updateCount();
    });

    row.append(input, remove);
    actionsRoot.append(row);
    refreshActionLabels();
    updateCount();
    return input;
  }

  function refreshActionLabels() {
    const rows = actionsRoot.querySelectorAll(".action-row");
    rows.forEach(function (row, index) {
      const input = row.querySelector("input");
      const remove = row.querySelector("button");
      const label = "Действие " + (index + 1);
      input.setAttribute("aria-label", label);
      remove.setAttribute("aria-label", "Удалить: " + label);
      remove.disabled = rows.length === 1;
    });
  }

  function filledActions() {
    return Array.from(actionsRoot.querySelectorAll("input"))
      .map(function (input) { return input.value.trim(); })
      .filter(Boolean);
  }

  function updateCount() {
    const total = filledActions().length;
    let text = "Сейчас пунктов: " + total + ". Для первой версии обычно хватает 3–5.";
    if (total > 5) {
      text += " Сейчас больше пяти — в первую версию можно оставить только главное.";
    }
    countNode.textContent = text;
  }

  function text(id) {
    return document.getElementById(id).value.trim();
  }

  function choice(name) {
    const selected = form.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : "";
  }

  function orBlank(value) {
    return value || "Не указано.";
  }

  function productType() {
    const type = choice("product-type");
    const other = text("product-type-other");
    if (type === "Другое" || (!type && other)) {
      return other ? "Другое: " + other : "Другое";
    }
    return type;
  }

  function bulletList(items) {
    if (!items.length) return "Не указано.";
    return items.map(function (item) { return "- " + item; }).join("\n");
  }

  function numbered(items) {
    return items.map(function (item, index) {
      return (index + 1) + ". " + item;
    }).join("\n");
  }

  function clearErrors() {
    formAlert.hidden = true;
    formAlert.textContent = "";
    form.querySelectorAll(".error").forEach(function (node) {
      node.hidden = true;
      node.textContent = "";
    });
    form.querySelectorAll(".is-invalid").forEach(function (node) {
      node.classList.remove("is-invalid");
    });
    form.querySelectorAll("[data-described]").forEach(function (control) {
      control.setAttribute("aria-describedby", control.dataset.described);
      control.removeAttribute("aria-invalid");
    });
  }

  function showError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId).closest(".field");
    const error = document.getElementById(errorId);
    field.classList.add("is-invalid");
    error.hidden = false;
    error.textContent = message;
    const control = document.getElementById(fieldId);
    if (control && control.matches("textarea, input")) {
      if (!control.dataset.described) {
        control.dataset.described = control.getAttribute("aria-describedby") || "";
      }
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", (control.dataset.described + " " + errorId).trim());
    }
    return field;
  }

  function validate() {
    clearErrors();
    const problems = [];

    if (!text("idea")) {
      problems.push(showError("idea", "error-idea", "Опишите, что хотите создать."));
    }
    if (!text("audience")) {
      problems.push(showError("audience", "error-audience", "Укажите, для кого создаётся продукт."));
    }
    if (!text("task")) {
      problems.push(showError("task", "error-task", "Опишите задачу, которую продукт решает."));
    }
    if (!filledActions().length) {
      const field = document.getElementById("actions").closest(".field");
      const error = document.getElementById("error-actions");
      field.classList.add("is-invalid");
      error.hidden = false;
      error.textContent = "Добавьте хотя бы одно действие пользователя.";
      problems.push(field);
    }

    if (!problems.length) return true;

    formAlert.hidden = false;
    formAlert.textContent = "Заполните обязательные поля — без них документ не из чего собрать.";
    problems[0].scrollIntoView({ behavior: "smooth", block: "center" });
    const focusTarget = problems[0].querySelector("textarea, input");
    if (focusTarget) focusTarget.focus();
    return false;
  }

  function openQuestions(data) {
    const questions = [];
    if (!data.name) questions.push("Название проекта не указано.");
    if (!data.type) questions.push("Тип продукта не выбран.");
    if (data.type === "Другое") questions.push("Тип «другое» выбран, но не уточнён.");
    if (!data.screens) questions.push("Не указаны страницы, экраны или разделы.");
    if (!data.inputs) questions.push("Не указано, какие данные вводит пользователь.");
    if (!data.outcome) questions.push("Не указано, какой результат получает пользователь.");
    [
      ["Регистрация", data.registration],
      ["Оплата", data.payment],
      ["Сохранение данных", data.storage],
      ["AI", data.ai]
    ].forEach(function (pair) {
      if (pair[1] === "Пока не знаю") {
        questions.push(pair[0] + ": пока не решено, нужно ли это в первой версии.");
      }
    });
    if (!data.outOfScope) questions.push("Не указано, что не входит в первую версию.");
    if (!data.style) questions.push("Не описаны стиль, цвета и настроение продукта.");
    if (!data.references) questions.push("Не указаны примеры или референсы.");
    if (!data.device) questions.push("Не выбрано, где будут пользоваться продуктом: компьютер, телефон или оба.");
    if (!data.tech) questions.push("Технологии или платформа не выбраны.");
    if (!data.limits) questions.push("Дополнительные ограничения и пожелания не указаны.");
    if (!data.works) questions.push("Не описано, как пользователь поймёт, что продукт работает.");
    if (!data.must) questions.push("Не указаны действия, которые обязательно должны выполняться успешно.");
    return questions;
  }

  function buildDocument(data) {
    const questions = openQuestions(data);
    const questionsText = questions.length
      ? bulletList(questions)
      : "По ответам формы пустых пунктов не осталось.";

    const lines = [
      "# Техническое задание",
      "",
      "Документ собран из ответов формы. Пустые поля отмечены словами «Не указано». Новые функции, аудитория, технологии, сроки и показатели сюда не добавлялись.",
      "",
      "## 1. Название и описание продукта",
      "",
      "**Название:** " + orBlank(data.name),
      "",
      "**Тип продукта:** " + orBlank(data.type),
      "",
      orBlank(data.idea),
      "",
      "## 2. Целевая аудитория",
      "",
      orBlank(data.audience),
      "",
      "## 3. Задача и ожидаемый результат",
      "",
      "**Задача пользователя:**",
      orBlank(data.task),
      "",
      "**Ожидаемый результат:**",
      orBlank(data.outcome),
      "",
      "## 4. Состав первой версии",
      "",
      "Действия, которые указаны для первой версии:",
      "",
      bulletList(data.actions),
      "",
      "## 5. Основной пользовательский сценарий",
      "",
      "Порядок ниже повторяет перечисленные действия. Отдельный сценарий не дописывался.",
      "",
      numbered(data.actions),
      "",
      "## 6. Страницы, экраны или разделы",
      "",
      orBlank(data.screens),
      "",
      "## 7. Вводимые данные и результаты",
      "",
      "**Пользователь вводит:**",
      orBlank(data.inputs),
      "",
      "**Пользователь получает:**",
      orBlank(data.outcome),
      "",
      "## 8. Регистрация, оплата, сохранение данных и AI",
      "",
      "- Регистрация: " + data.registration,
      "- Оплата: " + data.payment,
      "- Сохранение данных: " + data.storage,
      "- AI: " + data.ai,
      "",
      "## 9. Дизайн и адаптивность",
      "",
      "**Стиль, цвета и настроение:**",
      orBlank(data.style),
      "",
      "**Примеры или референсы:**",
      orBlank(data.references),
      "",
      "**Где будут пользоваться:** " + orBlank(data.device),
      "",
      "## 10. Технологии и ограничения",
      "",
      "**Технологии или платформа:**",
      orBlank(data.tech),
      "",
      "**Дополнительные ограничения и пожелания:**",
      orBlank(data.limits),
      "",
      "## 11. Что не входит в первую версию",
      "",
      orBlank(data.outOfScope),
      "",
      "## 12. Критерии приёмки",
      "",
      "**Как понять, что продукт работает:**",
      orBlank(data.works),
      "",
      "**Действия, которые обязательно должны выполняться успешно:**",
      orBlank(data.must),
      "",
      "## 13. Вопросы, которые нужно уточнить",
      "",
      questionsText,
      "",
      "## 14. Инструкция приложению для разработки",
      "",
      "Собери продукт только по разделам этого документа. Не добавляй функции, экраны, аудиторию, технологии, сроки и показатели, которых здесь нет. Пункты «Не указано» и «Пока не знаю» не заменяй собственными решениями: их нужно уточнить у автора задания."
    ];

    return lines.join("\n");
  }

  form.addEventListener("input", function (event) {
    const target = event.target;
    if (!target.matches || !target.matches("input, textarea")) return;
    const field = target.closest(".field");
    if (!field || !field.classList.contains("is-invalid")) return;

    if (target.name === "action") {
      if (!filledActions().length) return;
      field.classList.remove("is-invalid");
      document.getElementById("error-actions").hidden = true;
    } else if (target.value.trim()) {
      field.classList.remove("is-invalid");
      const error = field.querySelector(".error");
      if (error) error.hidden = true;
      target.removeAttribute("aria-invalid");
      if (target.dataset.described) {
        target.setAttribute("aria-describedby", target.dataset.described);
      }
    }

    if (!form.querySelector(".is-invalid")) formAlert.hidden = true;
  });

  addButton.addEventListener("click", function () {
    const input = addAction("");
    input.focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validate()) return;

    const data = {
      name: text("project-name"),
      idea: text("idea"),
      type: productType(),
      audience: text("audience"),
      task: text("task"),
      actions: filledActions(),
      screens: text("screens"),
      inputs: text("inputs"),
      outcome: text("outcome"),
      registration: choice("registration"),
      payment: choice("payment"),
      storage: choice("storage"),
      ai: choice("ai"),
      outOfScope: text("out-of-scope"),
      style: text("style"),
      references: text("references"),
      device: choice("device"),
      tech: text("tech"),
      limits: text("limits"),
      works: text("works"),
      must: text("must")
    };

    result.value = buildDocument(data);
    statusNode.textContent = "ТЗ собрано из текущих ответов. Текст можно править в поле ниже.";
    result.scrollIntoView({ behavior: "smooth", block: "start" });
    result.focus();
  });

  addAction("");
})();
