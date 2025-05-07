function enableShowAnswer() {
  document.getElementById("show-answer").disabled = false;
}

function disableShowAnswer() {
  document.getElementById("show-answer").disabled = true;
}

function showAnswer() {
  const answerSection = document.getElementById("answer-section");
  const nextButton = document.getElementById("next-button");
  const showAnswerButton = document.getElementById("show-answer");

  answerSection.style.display = "block";
  answerSection.innerHTML = "<p>Checking answer...</p>"; // Display "Checking answer"
  nextButton.disabled = true;

  sendAnswerData()
    .then((data) => {
      const { is_correct, correct_answer } = data;
      if (is_correct) {
        answerSection.innerHTML = `<p>Correct</p>`;
      } else {
        answerSection.innerHTML = `<p>Incorrect</p><h3>Correct Answer:</h3><p>${correct_answer}</p>`;
      }
      nextButton.disabled = false;
    })
    .catch((error) => {
      console.error("Error submitting answer:", error);
      answerSection.innerHTML =
        "<p>Error checking answer. Please try again.</p>";
    });

  disableShowAnswer();
}

function sendAnswerData() {
  const form = document.querySelector("form");
  const formData = new FormData(form);
  let answer;

  if (form.querySelectorAll('input[type="checkbox"]').length > 0) {
    // Collect all selected checkbox values
    answer = Array.from(formData.getAll("answer"));
  } else {
    // Handle single answer inputs
    answer = formData.get("answer");
  }

  return fetch(form.action, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Answer submitted successfully:", data);
      document.getElementById("next-button").dataset.nextQuestionUrl =
        data.next_question_url || "";
      return {
        is_correct: data.is_correct,
        correct_answer: data.correct_answer,
      }; // Return correctness and correct answer
    });
}

function navigateToNextQuestion() {
  const nextQuestionUrl =
    document.getElementById("next-button").dataset.nextQuestionUrl;
  if (nextQuestionUrl) {
    window.location.href = nextQuestionUrl;
  }
}

function validateDragTimer(input, target, tolerance) {
  if (input.value.trim() !== "") {
    enableShowAnswer();
  }
}

function validateDragQuantity(input, target) {
  if (input.value.trim() !== "") {
    enableShowAnswer();
  }
}

function handleDrop(event) {
  event.preventDefault();
  const droppedData = event.dataTransfer.getData("text/plain");
  event.target.innerText = droppedData;
  const hiddenInput = document.getElementById("drag-select-answer");
  if (hiddenInput) {
    hiddenInput.value = droppedData;
  }
  enableShowAnswer(); // Optionally enable buttons after a successful drop.
}
