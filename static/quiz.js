function enableShowAnswer() {
  document.getElementById("show-answer").disabled = false;
}

function disableShowAnswer() {
  document.getElementById("show-answer").disabled = true;
}

function showAnswer() {
  document.getElementById("answer-section").style.display = "block";
  document.getElementById("next-button").disabled = false;
  sendAnswerData();
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

  fetch(form.action, {
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
      // Store the next question URL for later navigation
      document.getElementById("next-button").dataset.nextQuestionUrl =
        data.next_question_url || "";
    })
    .catch((error) => {
      console.error("Error submitting answer:", error);
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
