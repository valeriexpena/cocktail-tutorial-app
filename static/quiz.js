function enableShowAnswer() {
  document.getElementById("show-answer").disabled = false;
}

function showAnswer() {
  document.getElementById("answer-section").style.display = "block";
  document.getElementById("next-button").disabled = false;
}

function validateDragTimer(input, target, tolerance) {
  const value = parseFloat(input.value);
  if (value >= target - tolerance && value <= target + tolerance) {
    enableShowAnswer();
  }
}

function validateDragQuantity(input, target) {
  const value = parseInt(input.value, 10);
  if (value === target) {
    enableShowAnswer();
  }
}
