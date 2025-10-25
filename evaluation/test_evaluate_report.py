import json
from deepeval import evaluate
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval, AnswerRelevancyMetric

def get_test_cases(path="./report/report.json"):
    data = json.load(open(path, "r", encoding="utf-8"))
    entries = data.get("testEntries", data if isinstance(data, list) else [])
    return [
        LLMTestCase(
            input=e["input"],
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),
            completion_time=e.get("completion_time"),
        )
        for e in entries
    ]

# metric = GEval(
#     name="Correctness",
#     criteria="Determine if the 'actual output' is correct based on the 'expected output'.",
#     evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
#     threshold=0.5,
# )
metric = AnswerRelevancyMetric(threshold=0.5)

tcs = get_test_cases()
result = evaluate(test_cases=tcs, metrics=[metric])