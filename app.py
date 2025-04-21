from flask import Flask, render_template, jsonify, request
import json

app = Flask(__name__)

# Load cocktail data from JSON file
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
        return jsonify({"error": "Step not found"}), 404

    return jsonify(step)

if __name__ == "__main__":
    app.run(debug=True)
