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
    cocktails = [
        {"id": drink_id, "name": drink["name"], "image": drink["image"]}
        for drink_id, drink in cocktail_data.items()
    ]
    return render_template("quiz_home.html", cocktails=cocktails)

@app.route("/tutorials")
def tutorials():
    cocktails = [
        {"id": drink_id, "name": drink["name"], "image": drink["image"]}
        for drink_id, drink in cocktail_data.items()
    ]
    return render_template("tutorials.html", cocktails=cocktails)

@app.route("/cocktail/<drink_id>/step/<step_id>", methods=["GET"])
def get_cocktail_step(drink_id, step_id):
    drink = cocktail_data.get(drink_id)
    if not drink:
        return jsonify({"error": "Drink not found"}), 404

    step = drink["steps"].get(step_id)
    if not step:
        return redirect(f"/cocktail/{drink_id}/quiz")

    return render_template(
        "learn.html",
        drink_id=drink_id,
        step_id=step_id,
        step_data=step,
        cocktail_name=drink["name"],
        prev_step_id=str(int(step_id) - 1) if int(step_id) > 1 else None,
        next_step_id=str(int(step_id) + 1)
    )

@app.route("/cocktail/<drink_id>/quiz", methods=["GET"])
def quiz_intro(drink_id):
    drink = cocktail_data.get(drink_id)
    if not drink:
        return jsonify({"error": "Drink not found"}), 404
    drink["responses"] = {}  # Clear past quiz data
    return render_template("quiz_intro.html", drink_id=drink_id, cocktail_name=drink["name"])

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
        correct_answer = question["correct"]

        # Handle drag-timer type
        if question["type"] == "drag-timer":
            target = correct_answer
            tolerance = question["tolerance"]
            try:
                answer_val = float(user_answer)
                is_correct = (target - tolerance) <= answer_val <= (target + tolerance)
            except (TypeError, ValueError):
                is_correct = False

        elif question["type"] == "drag-quantity":
            try:
                if user_answer is None or str(user_answer).strip() == "":
                    is_correct = False
                else:
                    is_correct = int(user_answer) == correct_answer
            except (TypeError, ValueError):
                is_correct = False

        else:
            if isinstance(correct_answer, list):
                if not isinstance(user_answer, list):
                    user_answer = [user_answer]
                user_clean = set(a.strip().lower() for a in user_answer)
                correct_clean = set(a.strip().lower() for a in correct_answer)
                app.logger.info(f"[DEBUG] Cleaned User Answer: {user_clean}, Cleaned Correct Answer: {correct_clean}")
                is_correct = user_clean == correct_clean
            else:
                user_str = str(user_answer).strip().lower()
                correct_str = str(correct_answer).strip().lower()
                app.logger.info(f"[DEBUG] Comparing → user: '{user_str}' vs correct: '{correct_str}'")
                is_correct = user_str == correct_str

        drink.setdefault("responses", {})[question_id] = {
            "user_answer": user_answer,
            "is_correct": is_correct
        }

        app.logger.info(
            f"User submitted answer for Q{question_id}: {user_answer}, Correct: {correct_answer}, Result: {is_correct}"
        )
        print("USER ANSWER:", user_answer, type(user_answer))
        print("CORRECT:", correct_answer, type(correct_answer))

        next_question_id = str(int(question_id) + 1)
        next_question_url = (
            f"/cocktail/{drink_id}/quiz/{next_question_id}"
            if next_question_id in quiz
            else f"/cocktail/{drink_id}/result"
        )

        return jsonify({
            "next_question_url": next_question_url,
            "is_correct": is_correct,
            "correct_answer": correct_answer
        }), 200

    return render_template(
        "quiz.html",
        drink_id=drink_id,
        question_id=question_id,
        question=question,
        cocktail_name=drink["name"]
    )

@app.route("/cocktail/<drink_id>/result")
def quiz_result(drink_id):
    drink = cocktail_data.get(drink_id)
    score = sum(1 for res in drink.get("responses", {}).values() if res.get("is_correct"))
    total = len(drink.get("quiz", {}))
    return render_template("result.html", cocktail_name=drink["name"], score=score, total=total)

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    app.run(debug=True, port=5001)

