import difflib
from collections import defaultdict, Counter
import json

def normalize(text):
    return text.lower().strip()

def group_answers(answers, cutoff=0.75):
    grouped = []
    labels = []

    for answer in answers:
        norm = normalize(answer)
        match = difflib.get_close_matches(norm, labels, n=1, cutoff=cutoff)
        if match:
            grouped.append(match[0])
        else:
            labels.append(norm)
            grouped.append(norm)

    return grouped

def process_survey_data(survey_data):
    questions = defaultdict(list)
    for entry in survey_data:
        questions[entry["question"]].append(entry["answer"])

    final_output = {}

    for question, answers in questions.items():
        grouped = group_answers(answers)
        count = Counter(grouped)
        sorted_counts = sorted(count.items(), key=lambda x: x[1], reverse=True)

        max_votes = sorted_counts[0][1]
        scored_answers = [
            {
                "answer": a.capitalize(),
                "count": c,
                "points": int((c / max_votes) * 100)
            }
            for a, c in sorted_counts
        ]
        final_output[question] = scored_answers

    return final_output

with open("sanskrit_survey_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

results = process_survey_data(data)

print("\nSurvey Results:")
for question, answers in results.items():
    print(f"\nQuestion: {question}")
    for i, ans in enumerate(answers, 1):
        print(f"{i}. {ans['answer']} - {ans['points']} points ({ans['count']} votes)")
