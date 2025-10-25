
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval

import json

def load_report():
    with open('./report/report.json', 'r') as file:
        return json.load(file)

def get_test_cases():
    report = load_report()
    return report['testEntries']

def test_correctness():
    correctness_metric = GEval(
        name="Correctness",
        criteria="Determine if the 'actual output' is correct based on the 'expected output'.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        threshold=0.5
    )

    test_cases = get_test_cases()

    for data in test_cases:
        test_case = LLMTestCase(
            input=data['input'],
            actual_output=data['actual_output'],
            expected_output=data['expected_output']
        )
        assert_test(test_case, [correctness_metric])
