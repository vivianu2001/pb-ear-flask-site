from flask import Flask, request, render_template
from pb_ear import pb_ear
import json
import os

def summarize_voter_groups(voters):
    from collections import defaultdict
    grouped = defaultdict(int)
    for weight, prefs in voters:
        key = (weight, tuple(prefs))
        grouped[key] += 1

    summary = []
    for (weight, prefs), count in grouped.items():
        summary.append({
            "count": count,
            "weight": weight,
            "preferences": list(prefs)
        })
    return summary


app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/run", methods=["POST"])
def run():
    try:
        budget = float(request.form["budget"])
        project_names = json.loads(request.form["projects_json"])
        voters_raw = json.loads(request.form["voters_json"]) 

        candidates = [(name, cost) for name, cost in project_names]


        result = pb_ear(voters_raw, candidates, budget) 

        voter_summary = summarize_voter_groups(voters_raw)

        log_path = os.path.join("logs", "pb_ear.log")
        log_content = ""
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8") as f:
                log_content = f.read()

        return render_template(
            "result.html",
            budget=budget,
            candidates=project_names,
            voter_summary=voter_summary,
            result=result,
            log=log_content
        )

    except Exception as e:
        return f"<h1>Error occurred</h1><pre>{e}</pre><p><a href='/'>← Back to main page</a></p>"
    
@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    app.run(debug=True)
