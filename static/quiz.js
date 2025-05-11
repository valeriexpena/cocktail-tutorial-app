function enableShowAnswer() {
  document.getElementById("show-answer").disabled = false;
}
function disableShowAnswer() {
  document.getElementById("show-answer").disabled = true;
}
function showAnswer() {
  const answerSection = document.getElementById("answer-section");
  const nextButton = document.getElementById("next-button");
  answerSection.style.display = "block";
  answerSection.innerHTML = "<p>Checking answer...</p>";
  nextButton.disabled = true;

  sendAnswerData()
    .then((data) => {
      let { is_correct, correct_answer } = data;

      if (!Array.isArray(correct_answer)) {
        try {
          correct_answer = JSON.parse(correct_answer);
        } catch {
          correct_answer = [correct_answer];
        }
      }

      const correctSet = new Set(correct_answer);

      document.querySelectorAll('.drop-item, .dropped-liquor, .image-option').forEach(el => {
        el.classList.remove('correct-drop', 'incorrect-drop', 'correct', 'incorrect', 'selected');
      });

      document.querySelectorAll('.dropped-liquor').forEach(el => {
        const value = el.innerText.trim();
        if (correctSet.has(value)) {
          el.classList.add("correct-drop");
        } else {
          el.classList.add("incorrect-drop");
        }
      });

      document.querySelectorAll('.image-option').forEach(div => {
        const input = div.querySelector('input[name="answer"]');
        const value = input?.value;
        if (input?.checked) {
          if (correctSet.has(value)) {
            div.classList.add('correct');
          } else {
            div.classList.add('incorrect');
          }
        }
      });

      answerSection.innerHTML = is_correct
        ? `<p>✅ Correct</p>`
        : `<p>❌ Incorrect</p><h3>Correct Answer:</h3><p>${correct_answer.join(", ")}</p>`;

      nextButton.disabled = false;
    })
    .catch((error) => {
      console.error("Error submitting answer:", error);
      answerSection.innerHTML = "<p>Error checking answer. Please try again.</p>";
    });

  disableShowAnswer();
}
function sendAnswerData() {
  const form = document.querySelector("form");
  const formData = new FormData(form);
  let answer;

  if (form.querySelectorAll('input[type="checkbox"]').length > 0) {
    answer = Array.from(formData.getAll("answer"));
  } else {
    const raw = formData.get("answer");
    answer = isNaN(raw) ? raw : Number(raw);
  }

  return fetch(form.action, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to submit answer");
      return response.json();
    })
    .then((data) => {
      console.log("Answer submitted successfully:", data);
      document.getElementById("next-button").dataset.nextQuestionUrl = data.next_question_url || "";
      return {
        is_correct: data.is_correct,
        correct_answer: data.correct_answer,
      };
    });
}

function navigateToNextQuestion() {
  const nextQuestionUrl = document.getElementById("next-button").dataset.nextQuestionUrl;
  if (nextQuestionUrl) window.location.href = nextQuestionUrl;
}

function validateDragTimer(input, target, tolerance) {
  if (input.value.trim() !== "") enableShowAnswer();
}

function validateDragQuantity(input, target) {
  if (input.value.trim() !== "") enableShowAnswer();
}

function handleDrop(event) {
  event.preventDefault();
  const droppedData = event.dataTransfer.getData("text/plain");
  event.target.innerText = droppedData;
  const hiddenInput = document.getElementById("drag-select-answer");
  if (hiddenInput) hiddenInput.value = droppedData;
  enableShowAnswer();
}

function toggleSelection(div) {
  const checkbox = div.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  div.classList.toggle("selected", checkbox.checked);

  const anyChecked = document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
  if (anyChecked) {
    enableShowAnswer();
  } else {
    disableShowAnswer();
  }
}

let droppedLiquors = [];

function handleLiquorDrag(event) {
  event.dataTransfer.setData("text/plain", event.target.dataset.name);
}

function handleLiquorDrop(event) {
  event.preventDefault();
  const liquor = event.dataTransfer.getData("text/plain");
  const zone = document.getElementById("shaker-drop-zone");

  if (!droppedLiquors.includes(liquor)) {
    droppedLiquors.push(liquor);

    const tag = document.createElement("p");
    tag.innerText = liquor;
    tag.className = "dropped-liquor drop-item";
    tag.dataset.name = liquor;

    zone.appendChild(tag);
    document.getElementById("liquor-answer").value = JSON.stringify(droppedLiquors);

    enableShowAnswer();
  }
}

function handleDrinkDrop(event) {
  event.preventDefault();
  const drink = event.dataTransfer.getData("text/plain");
  const zone = document.getElementById("drink-drop-zone");

  zone.innerHTML = "";

  const tag = document.createElement("p");
  tag.textContent = drink;
  tag.className = "dropped-liquor drop-item";
  tag.dataset.name = drink;

  zone.appendChild(tag);
  document.getElementById("drag-select-answer").value = drink;

  enableShowAnswer();
}

function handleDrinkDrag(event) {
  event.dataTransfer.setData("text/plain", event.target.dataset.name);
}

// Bean counter logic
let beanCount = 0;

function handleBeanDrag(event) {
  event.dataTransfer.setData("text/plain", "bean");
}

function handleBeanDrop(event) {
  event.preventDefault();

  const dropZone = document.getElementById("cup-drop-area");
  const img = document.createElement("img");
  img.src = "/static/images/coffee_bean.png";
  img.alt = "Coffee Bean";
  img.style.width = "30px";
  img.style.margin = "2px";

  dropZone.appendChild(img);

  beanCount += 1;
  document.getElementById("bean-count").value = beanCount;

  enableShowAnswer();
}

