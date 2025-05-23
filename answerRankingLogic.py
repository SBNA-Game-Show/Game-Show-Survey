import difflib
from collections import defaultdict, Counter

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

sample_data = [
    {"question": "Name a common Sanskrit greeting or salutation.", "answer": "Namaste"},
    {"question": "Name a common Sanskrit greeting or salutation.", "answer": "namaskara"},
    {"question": "Name a Sanskrit word related to family relationships.", "answer": "mata"},
    {"question": "Name a Sanskrit word related to family relationships.", "answer": "pita"},
    {"question": "Name a Sanskrit term for a natural element (earth, water, fire, etc.).", "answer": "Agni"},
    {"question": "Name a Sanskrit term for a natural element (earth, water, fire, etc.).", "answer": "jal"},
    {"question": "Name a Sanskrit word for an emotion or feeling.", "answer": "Prema"},
    {"question": "Name a Sanskrit word for an emotion or feeling.", "answer": "shoka"},
    {"question": "Name a Sanskrit term for a body part.", "answer": "Hasta"},
    {"question": "Name a Sanskrit term for a body part.", "answer": "pada"},
    {"question": "Name a Sanskrit word for a number.", "answer": "eka"},
    {"question": "Name a Sanskrit word for a number.", "answer": "dva"},
    {"question": "Name a Sanskrit word for an animal.", "answer": "Simha"},
    {"question": "Name a Sanskrit word for an animal.", "answer": "mriga"},
    {"question": "Name a color term in Sanskrit.", "answer": "nila"},
    {"question": "Name a color term in Sanskrit.", "answer": "rakta"},
]

results = process_survey_data(sample_data)

print("\nSurvey Results:")
for question, answers in results.items():
    print(f"\nQuestion: {question}")
    for i, ans in enumerate(answers, 1):
        print(f"{i}. {ans['answer']} - {ans['points']} points ({ans['count']} votes)")
