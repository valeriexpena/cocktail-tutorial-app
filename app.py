from flask import Flask, render_template, jsonify, request, redirect
import json
import logging

app = Flask(__name__)
app.secret_key = "super_secret_key"

with open("learning_data.json", "r") as file:
    cocktail_data = json.load(file)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/quiz")
def quiz_home():
    return render_template("quiz_home.html")


@app.route("/tutorials")
def tutorials():
    return render_template("tutorials.html")  # This should be the page showing cocktail list

@app.route("/cocktail/<drink_id>/step/<step_id>", methods=["GET"])
def get_cocktail_step(drink_id, step_id):
    drink = cocktail_data.get(drink_id)
    if not drink:
        return jsonify({"error": "Drink not found"}), 404

    step = drink["steps"].get(step_id)
    if not step:
        return redirect(f"/cocktail/{drink_id}/quiz")

    return render_template("learn.html",
                           drink_id=drink_id,
                           step_id=step_id,
                           step_data=step,
                           cocktail_name=drink["name"],
                           next_step_id=str(int(step_id) + 1))

@app.route("/cocktail/<drink_id>/quiz", methods=["GET"])
def quiz_intro(drink_id):
    drink = cocktail_data.get(drink_id)
    if not drink:
        return jsonify({"error": "Drink not found"}), 404
    drink["responses"] = {}  # Initialize responses for quiz
    return render_template("quiz_intro.html",
                           drink_id=drink_id,
                           cocktail_name=drink["name"])

@app.route("/cocktail/<drink_id>/quiz/<question_id>", methods=["GET", "POST"])
def get_quiz_question(drink_id, question_id):
    drink = cocktail_data.get(drink_id)
    if not drink:
        return jsonify({"error": "Drink not found"}), 404

    quiz = drink.get("quiz")
    if not quiz or question_id not in quiz:
        return redirect(f"/cocktail/{drink_id}/result")

    question = quiz[question_id]

    if request.method == "POST":
        user_answer = request.get_json().get("answer")
        # Determine correctness according to question type
        if question["type"] == "drag-timer":
            target = question["target_seconds"]
            tolerance = question["tolerance"]
            try:
                answer_val = float(user_answer)
                is_correct = (target - tolerance) <= answer_val <= (target + tolerance)
            except (TypeError, ValueError):
                is_correct = False
        elif question["type"] == "drag-quantity":
            target = question["target"]
            try:
                answer_val = int(user_answer)
                is_correct = answer_val == target
            except (TypeError, ValueError):
                is_correct = False
        else:
            correct_answer = question["correct"]
            if isinstance(correct_answer, list):
                if not isinstance(user_answer, list):
                    user_answer = [user_answer]
                is_correct = set(user_answer) == set(correct_answer)
            else:
                is_correct = user_answer == correct_answer

        # Save the answer and correctness in the cocktail_data responses
        drink.setdefault("responses", {})[question_id] = {"user_answer": user_answer, "is_correct": is_correct}

        app.logger.info(f"User submitted answer for question {question_id}: {user_answer}, Answer: {question.get('correct')}, Correct: {is_correct}")

        next_question_id = str(int(question_id) + 1)
        if next_question_id in quiz:
            return jsonify({"next_question_url": f"/cocktail/{drink_id}/quiz/{next_question_id}"})
        else:
            return jsonify({"next_question_url": f"/cocktail/{drink_id}/result"})

    return render_template("quiz.html",
                           drink_id=drink_id,
                           question_id=question_id,
                           question=question,
                           cocktail_name=drink["name"])

@app.route("/cocktail/<drink_id>/result")
def quiz_result(drink_id):
    drink = cocktail_data.get(drink_id)
    score = sum(1 for res in drink.get("responses", {}).values() if res.get("is_correct"))
    total = len(drink.get("quiz", {}))  # derive total questions from JSON
    return render_template("result.html", cocktail_name=drink["name"], score=score, total=total)

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)  # Configure logging to show debug messages
    app.run(debug=True, port=5001)

