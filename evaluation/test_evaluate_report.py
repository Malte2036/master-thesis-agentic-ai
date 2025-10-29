import json
from typing import Iterable, List, Any, Dict
from deepeval import evaluate
from deepeval.test_case import LLMTestCase, LLMTestCaseParams, ToolCall
from deepeval.metrics import GEval, AnswerRelevancyMetric, ContextualRelevancyMetric,ToolCorrectnessMetric

def _flatten_context(x: Any) -> List[str]:
    """Normalize retrieval_context into a flat List[str]."""
    if x is None:
        return []
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        # Try common text fields
        for k in ("text", "content", "page_content", "body"):
            if isinstance(x.get(k), str):
                return [x[k]]
        # Fallback: stringify
        return [json.dumps(x, ensure_ascii=False)]
    if isinstance(x, Iterable):
        out: List[str] = []
        for item in x:
            out.extend(_flatten_context(item))
        return out
    return [str(x)]

def get_expected_tool_calls(e: Dict[str, Any]) -> List[ToolCall]:
    tool_calls = []
    for tool_call in e.get("expected_tool_calls", []):
        tool_calls.append(ToolCall(
            name=tool_call.get("tool"),
            input_parameters=tool_call.get("args"),
        ))
    return tool_calls

def get_tools_called(e: Dict[str, Any]) -> List[ToolCall]:
    tool_calls = []
    for tool_call in e.get("trace", []):
        tool_calls.append(ToolCall(
            name=tool_call.get("tool"),
            input_parameters=tool_call.get("args"),
        ))
    return tool_calls

def get_test_cases(path: str = "./report/report.json") -> List[LLMTestCase]:
    data = json.load(open(path, "r", encoding="utf-8"))
    entries = data.get("testEntries", data if isinstance(data, list) else [])
    tcs = []
    for e in entries:
        ctx = _flatten_context(e.get("retrieval_context"))
        tc = LLMTestCase(
            input=e["input"],
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),   # optional
            retrieval_context=ctx,                      # must be List[str]
            completion_time=e.get("completion_time"),
            expected_tools=get_expected_tool_calls(e),
            tools_called=get_tools_called(e),
        )
        tcs.append(tc)
    
    return tcs

metrics = [
    # AnswerRelevancyMetric(threshold=0.5),
    # ContextualRelevancyMetric(threshold=0.7)
]

metrics.append(
    ToolCorrectnessMetric(
        should_consider_ordering=True,
    )
)

# # --- Core correctness / faithfulness (use one or both) ---
# metrics.append(GEval(
#     name="Correctness (vs expected)",
#     evaluation_steps=[
#         "Compare ACTUAL_OUTPUT to EXPECTED_OUTPUT.",
#         "Mark as incorrect if any required fact in EXPECTED_OUTPUT is missing or wrong.",
#         "Paraphrasing is fine; factual content must match.",
#     ],
#     evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
#     threshold=0.7,
# ))

# metrics.append(GEval(
#     name="Faithfulness (to retrieval_context)",
#     evaluation_steps=[
#         "Check that every non-trivial claim in ACTUAL_OUTPUT is supported by RETRIEVAL_CONTEXT.",
#         "Penalize claims that contradict or are not supported by the context.",
#         "Minor surface differences are fine; focus on factual consistency.",
#     ],
#     evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.RETRIEVAL_CONTEXT],
#     threshold=0.7,
# ))

# # --- Agent-shaped rubrics (customizable per task type) ---
# metrics.append(GEval(
#     name="Task Compliance",
#     evaluation_steps=[
#         "Did the answer follow all user constraints?",
#         "If the task is 'create calendar item', verify presence of: course name/code, assignment title, due date/time, timezone/normalization.",
#         "If the task is 'answer a question', verify the requested format (bulleted summary, steps, etc.).",
#     ],
#     evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
#     threshold=0.7,
# ))

# metrics.append(GEval(
#     name="Attribution / Citations",
#     evaluation_steps=[
#         "Check that the answer cites sources (URLs or bibliographic entries).",
#         "Citations should be specific (point to the exact page) and appear where claims are made or in a 'Sources' section.",
#         "Penalize missing/placeholder links.",
#     ],
#     evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
#     threshold=0.6,
# ))

# metrics.append(GEval(
#     name="Format Compliance",
#     evaluation_steps=[
#         "Verify the answer respects required format (e.g., Markdown sections, APA/MLA where requested, deliverables list).",
#         "Penalize if the structure is not followed.",
#     ],
#     evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
#     threshold=0.7,
# ))

tcs = get_test_cases()
result = evaluate(test_cases=tcs, metrics=metrics)