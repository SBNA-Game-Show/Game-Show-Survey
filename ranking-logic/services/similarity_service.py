"""
Similarity Service with Canonical Label Selection
- Levenshtein-based merging
- Canonical choice: isCorrect -> most frequent -> shortest -> alphabetical
- Stable _id; summed responseCount; best rank/score preserved
"""

import logging
from typing import List, Dict, Tuple, Optional
from config.settings import Config
from utils.data_formatters import QuestionFormatter
from constants import AnswerFields

logger = logging.getLogger("survey_analytics")



def _levenshtein_similarity(a: str, b: str) -> float:
    a = (a or "").strip().lower()
    b = (b or "").strip().lower()
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        ca = a[i - 1]
        for j in range(1, m + 1):
            cb = b[j - 1]
            cost = 0 if ca == cb else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,      # delete
                dp[i][j - 1] + 1,      # insert
                dp[i - 1][j - 1] + cost  # substitute
            )
    dist = dp[n][m]
    return max(0.0, 1.0 - dist / max(n, m))


def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _to_int(v) -> int:
    try:
        return int(v)
    except Exception:
        return 0


def _is_true(v) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() in {"true", "1", "yes", "y"}
    return bool(v)



def _pick_canonical_from_pool(pool: List[Dict]) -> str:
    """
    Pool = list of answers (dicts) that are all considered the same cluster.
    1) If any isCorrect -> only consider those
    2) Among considered, pick most frequent normalized form
    3) Tie-break by shortest, then alphabetical
    """
    if not pool:
        return ""

    corrects = [a for a in pool if _is_true(a.get(AnswerFields.IS_CORRECT))]
    candidates = corrects if corrects else pool

    # frequency by normalized text
    freq = {}
    for a in candidates:
        n = _norm(a.get(AnswerFields.ANSWER))
        freq[n] = freq.get(n, 0) + _to_int(a.get(AnswerFields.RESPONSE_COUNT))

    # choose: most frequent, then shortest, then alphabetical
    # max by (frequency, -len, reverse alphabetical? No -> alphabetical so use negative len only)
    best_norm = max(freq.items(), key=lambda kv: (kv[1], -len(kv[0]), (-1) * 0))[
        0
    ]

    return best_norm


def _pick_best_rank_score(pool: List[Dict]) -> Tuple[int, int]:
    """
    Among pooled variants, carry over the "best" rank/score pair.
    - Best rank = lowest positive rank
    - If no positive rank, carry score 0, rank 0
    """
    best_rank = None
    best_score = 0
    for a in pool:
        r = _to_int(a.get(AnswerFields.RANK))
        s = _to_int(a.get(AnswerFields.SCORE))
        if r > 0:
            if best_rank is None or r < best_rank or (r == best_rank and s > best_score):
                best_rank, best_score = r, s
    if best_rank is None:
        return 0, 0
    return best_rank, best_score


def _cluster_sum_count(pool: List[Dict]) -> int:
    return sum(_to_int(a.get(AnswerFields.RESPONSE_COUNT)) for a in pool)



class SimilarityService:
    """
    Public entry used by app/routes:
    - merge_similar_answers(answers, allowed_canon=None) -> (merged_answers, duplicates_count)
    - process_all_questions() to apply across all
    """

    def __init__(self, db_handler):
        self.db = db_handler
        th = Config.SIMILARITY_THRESHOLD
        # clamp
        try:
            th = float(th)
        except Exception:
            th = 0.75
        self.threshold = max(0.0, min(1.0, th))

    def _closest_allowed(self, term: str, allowed: List[str]) -> Tuple[Optional[str], float]:
        best = None
        best_sim = 0.0
        for a in allowed or []:
            s = _levenshtein_similarity(term, a)
            if s > best_sim:
                best, best_sim = a, s
        return best, best_sim

    def merge_similar_answers(
        self, answers: List[Dict], allowed_canon: Optional[List[str]] = None
    ) -> Tuple[List[Dict], int]:
        """
        Merge answers by similarity.
        - If `allowed_canon` provided, map each to closest allowed canonical when similarity >= threshold.
        - Otherwise cluster by pairwise similarity >= threshold and pick canonical using the rule above.
        """
        answers = answers or []
        if not answers:
            return [], 0

        n = len(answers)
        used = [False] * n
        merged: List[Dict] = []
        duplicates = 0

        for i in range(n):
            if used[i]:
                continue
            base = answers[i]
            cluster = [base]
            used[i] = True

            ai = _norm(base.get(AnswerFields.ANSWER))

            # form cluster around `base`
            for j in range(i + 1, n):
                if used[j]:
                    continue
                bj = answers[j]
                aj = _norm(bj.get(AnswerFields.ANSWER))

                if allowed_canon:
                    # both side: try map to allowed term; if they map to the same canonical above threshold,
                    # treat them as equal
                    cai, simi = self._closest_allowed(ai, allowed_canon)
                    caj, simj = self._closest_allowed(aj, allowed_canon)
                    if cai and caj and cai == caj and simi >= self.threshold and simj >= self.threshold:
                        cluster.append(bj)
                        used[j] = True
                        continue

                # otherwise: direct similarity
                sim = _levenshtein_similarity(ai, aj)
                if sim >= self.threshold:
                    cluster.append(bj)
                    used[j] = True

            # now finalize one merged row from `cluster`
            if len(cluster) > 1:
                duplicates += len(cluster) - 1

            kept = {k: v for k, v in base.items()}

            # summed count
            kept[AnswerFields.RESPONSE_COUNT] = _cluster_sum_count(cluster)

            # any correct?
            kept[AnswerFields.IS_CORRECT] = any(
                _is_true(a.get(AnswerFields.IS_CORRECT)) for a in cluster
            )

            # pick canonical answer text
            if allowed_canon:
                pooled_norm = _pick_canonical_from_pool(cluster)
                canon, sim = self._closest_allowed(pooled_norm, allowed_canon)
                if canon and sim >= self.threshold:
                    kept[AnswerFields.ANSWER] = canon
                else:
                    kept[AnswerFields.ANSWER] = pooled_norm
            else:
                kept[AnswerFields.ANSWER] = _pick_canonical_from_pool(cluster)

            # carry best rank/score among members (lower rank is better)
            best_rank, best_score = _pick_best_rank_score(cluster)
            kept[AnswerFields.RANK] = best_rank
            kept[AnswerFields.SCORE] = best_score

            merged.append(kept)

        return merged, duplicates

   
    def _fetch_questions(self) -> List[Dict]:
        qs = self.db.fetch_all_questions()
        if not qs:
            logger.warning("No questions found for similarity processing")
        return qs

    def process_all_questions(self) -> Dict:
        try:
            questions = self._fetch_questions()
            if not questions:
                return {
                    "total_questions": 0,
                    "processed_count": 0,
                    "updated_count": 0,
                    "failed_count": 0,
                    "duplicates_merged": 0,
                }

            processed = []
            dup_total = 0
            for q in questions:
                ans = q.get(AnswerFields.ANSWERS) or []
                merged, d = self.merge_similar_answers(ans)
                q[AnswerFields.ANSWERS] = merged
                processed.append(q)
                dup_total += d

            upd = self.db.bulk_update_questions(processed)

            return {
                "total_questions": len(questions),
                "processed_count": len(processed),
                "updated_count": upd.get("updated_count", 0),
                "failed_count": upd.get("failed_count", 0),
                "duplicates_merged": dup_total,
            }
        except Exception as e:
            logger.error("Similarity processing failed: %s", e)
            raise
