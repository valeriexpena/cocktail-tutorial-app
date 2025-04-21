from flask import Flask, render_template, jsonify, request, redirect, session
import json

app = Flask(__name__)
app.secret_key = "super_secret_key"

with open("learning_data.json", "r") as file:
    cocktail_data = json.load(file)

@app.route("/")
def home():
    return render_template("index.html")

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
        return render_template("result.html", cocktail_name=drink["name"])

    question = quiz[question_id]

    if request.method == "POST":
        return redirect(f"/cocktail/{drink_id}/quiz/{int(question_id) + 1}")

    return render_template("quiz.html",
                           drink_id=drink_id,
                           question_id=question_id,
                           question=question,
                           cocktail_name=drink["name"])

@app.route("/cocktail/<drink_id>/result")
def quiz_result(drink_id):
    drink = cocktail_data.get(drink_id)
    return render_template("result.html", cocktail_name=drink["name"])

if __name__ == "__main__":
    app.run(debug=True)

