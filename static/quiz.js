function enableShowAnswer() {
  document.getElementById("show-answer").disabled = false;
}
function disableShowAnswer() {
  document.getElementById("show-answer").disabled = true;
}
function showAnswer() {
  const answerSection = document.getElementById("answer-section");
  const nextButton = document.getElementById("next-button");
  const form = document.querySelector("form");
  const questionType = form.dataset.type;

  answerSection.style.display = "block";

  if (questionType === "drag-timer") {
    const correctTime = form.querySelector("input[name='answer']").dataset
      .correctTime;
    answerSection.innerHTML = `<p>✅ Correct Answer: Hold for ${correctTime} seconds.</p>`;
  } else {
    answerSection.innerHTML = "<p>Checking answer...</p>";
    nextButton.disabled = true;

    sendAnswerData()
      .then((data) => {
        let { is_correct, correct_answer } = data;

        if (!Array.isArray(correct_answer)) {
          correct_answer = [correct_answer];
        }

        const correctSet = new Set(correct_answer);

        document
          .querySelectorAll(".drop-item, .dropped-liquor, .image-option")
          .forEach((el) => {
            el.classList.remove(
              "correct-drop",
              "incorrect-drop",
              "correct",
              "incorrect",
              "selected"
            );
          });

        document.querySelectorAll(".dropped-liquor").forEach((el) => {
          const value = el.dataset.name; // Changed from innerText.trim()
          if (correctSet.has(value)) {
            el.classList.add("correct-drop");
          } else {
            el.classList.add("incorrect-drop");
          }
        });

        document.querySelectorAll(".image-option").forEach((div) => {
          const input = div.querySelector('input[name="answer"]');
          const value = input?.value;
          if (input?.checked) {
            if (correctSet.has(value)) {
              div.classList.add("correct");
            } else {
              div.classList.add("incorrect");
            }
          }
        });

        answerSection.innerHTML = is_correct
          ? `<p>✅ Correct</p>`
          : `<p>❌ Incorrect</p><h3>Correct Answer:</h3><p>${correct_answer.join(
              ", "
            )}</p>`;

        nextButton.disabled = false;
      })
      .catch((error) => {
        console.error("Error submitting answer:", error);
        answerSection.innerHTML =
          "<p>Error checking answer. Please try again.</p>";
      });
  }

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
      document.getElementById("next-button").dataset.nextQuestionUrl =
        data.next_question_url || "";
      // Process correct_answer: if not array, wrap it.
      let { is_correct, correct_answer } = data;
      if (!Array.isArray(correct_answer)) {
        correct_answer = [correct_answer];
      }
      return {
        is_correct: is_correct,
        correct_answer: correct_answer,
        next_question_url: data.next_question_url,
      };
    });
}

function navigateToNextQuestion() {
  const nextQuestionUrl =
    document.getElementById("next-button").dataset.nextQuestionUrl;
  console.log(
    "Next question URL 2:",
    document.getElementById("next-button").dataset.nextQuestionUrl
  );
  if (nextQuestionUrl) {
    window.location.href = nextQuestionUrl;
  } else {
    alert("No next question URL found.");
  }
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

  const anyChecked =
    document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
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
    tag.innerText = liquor + " "; // Add space before button

    // Create remove button to undo a mistaken drop
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "x";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      zone.removeChild(tag);
      const index = droppedLiquors.indexOf(liquor);
      if (index > -1) {
        droppedLiquors.splice(index, 1);
      }
      document.getElementById("liquor-answer").value =
        JSON.stringify(droppedLiquors);
      // Disable show answer if drop zone is empty
      if (!zone.querySelector(".dropped-liquor")) {
        disableShowAnswer();
      }
    });
    tag.appendChild(removeBtn);

    tag.className = "dropped-liquor drop-item";
    tag.dataset.name = liquor;

    zone.appendChild(tag);
    document.getElementById("liquor-answer").value =
      JSON.stringify(droppedLiquors);

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

let dragTimerStart = null;

function handleDragTimerStart(event) {
  dragTimerStart = new Date();
}

function handleDragTimerEnd(event, correctTime, tolerance) {
  if (!dragTimerStart) return;

  const dragDuration = (new Date() - dragTimerStart) / 1000;
  dragTimerStart = null;

  const isValid = Math.abs(dragDuration - correctTime) <= tolerance;
  const hiddenInput = document.getElementById("drag-timer-answer");
  hiddenInput.value = dragDuration;
  hiddenInput.dataset.correctTime = correctTime;

  const feedbackMessage = isValid
    ? `✅ Correct! You held for ${dragDuration.toFixed(1)} seconds.`
    : `❌ Incorrect! You held for ${dragDuration.toFixed(
        1
      )} seconds. Try again if you'd like.`;

  const answerSection = document.getElementById("answer-section");
  answerSection.style.display = "block";
  answerSection.innerHTML = `<p>${feedbackMessage}</p>`;

  // Send the answer to the server
  sendAnswerData()
    .then((data) => {
      const { is_correct, correct_answer, next_question_url } = data;
      document.getElementById("next-button").dataset.nextQuestionUrl =
        next_question_url || "";

      answerSection.innerHTML += is_correct
        ? `<p>✅ Correct</p>`
        : `<p>❌ Incorrect</p><h3>Correct Answer:</h3><p>${correct_answer}</p>`;

      document.getElementById("next-button").disabled = false;
    })
    .catch((error) => {
      console.error("Error submitting answer:", error);
      answerSection.innerHTML =
        "<p>Error checking answer. Please try again.</p>";
    });

  enableShowAnswer();
}
