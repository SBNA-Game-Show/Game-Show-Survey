import difflib

def normalize(text):
    return text.lower().strip()

def group_answers_with_counts(answers, cutoff=0.75):
    groups = {}
    labels = []
    for answer in answers:
        norm = normalize(answer["answer"])
        # Safely get count (handle $numberInt or plain int)
        if isinstance(answer["responseCount"], dict) and "$numberInt" in answer["responseCount"]:
            count = int(answer["responseCount"]["$numberInt"])
        else:
            count = int(answer["responseCount"])

        matched = False
        for key in labels:
            if difflib.SequenceMatcher(None, norm, key).ratio() >= cutoff:
                groups[key] += count
                matched = True
                break
        if not matched:
            labels.append(norm)
            groups[norm] = count

    return groups

def process_top_5_answers(data):
    output = []
    score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}

    for entry in data:
        question_id = str(entry["_id"])
        question_text = entry["question"]
        answers = entry.get("answers", [])

        grouped_counts = group_answers_with_counts(answers)
        sorted_answers = sorted(grouped_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        ranked_answers = []
        for rank, (ans, count) in enumerate(sorted_answers, start=1):
            score = score_map.get(rank, 0)
            ranked_answers.append({
                "answer_text": ans.capitalize(),
                "count": count,
                "score": score,
                "rank": rank
            })

        output.append({
            "question_id": question_id,
            "question_text": question_text,
            "top_answers": ranked_answers
        })

    return output
