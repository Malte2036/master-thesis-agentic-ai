import json
from typing import Iterable, List, Any, Dict
from deepeval import evaluate
from deepeval.test_case import LLMTestCase, LLMTestCaseParams, ToolCall, ToolCallParams
from deepeval.metrics import GEval, AnswerRelevancyMetric, ContextualRelevancyMetric,ToolCorrectnessMetric


def get_expected_tool_calls(e: Dict[str, Any]) -> List[ToolCall]:
    tool_calls = []
    for tool_call in e.get("expected_tool_calls", []):
        tool_calls.append(ToolCall(
            name=tool_call.get("function"),
            input_parameters=tool_call.get("args"),
        ))
    return tool_calls

def get_tools_called(e: Dict[str, Any], prefix: str | None = None) -> List[ToolCall]:
    tool_calls = []
    
    iteration_history = e.get("iterationHistory", [])
    for iteration in iteration_history:
        for function_call in iteration.get("structuredThought").get("functionCalls", []):
            if function_call.get("type") == "agent":
                tool_calls.extend(
                    get_tools_called(function_call.get("internalRouterProcess"), prefix=function_call.get("function"))
                )
            
            if function_call.get("type") == "mcp":
                function_name = f"{prefix}.{function_call.get('function')}" if prefix else function_call.get("function")
                tool_calls.append(ToolCall(
                    name=function_name,
                    input_parameters=function_call.get("args"),
                ))

    return tool_calls

def get_context(e: Dict[str, Any]) -> List[str]:
    context = []
    
    iteration_history = e.get("iterationHistory", [])
    for iteration in iteration_history:
        for function_call in iteration.get("structuredThought").get("functionCalls", []):
            if function_call.get("type") == "agent":
                context.extend(
                    get_context(function_call.get("internalRouterProcess"))
                )
            
            if function_call.get("type") == "mcp":
                context.append(function_call.get("result"))

    return context

def get_test_cases(path: str = "./report/report.json") -> List[LLMTestCase]:
    data = json.load(open(path, "r", encoding="utf-8"))
    entries = data.get("testEntries", data if isinstance(data, list) else [])
    tcs = []
    for e in entries:
        trace = e.get("trace", {})
         # Add default context
        context = [x.get("description") for x in trace.get("agentTools", [])]
        context.extend(get_context(trace))

        tool_calls = get_tools_called(trace)

        tc = LLMTestCase(
            input=e["input"],
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),   # optional
            context=context,                      # must be List[str]
            completion_time=e.get("completion_time"),
            expected_tools=get_expected_tool_calls(e),
            tools_called=tool_calls,
        )
        tcs.append(tc)
    
    return tcs

metrics = [
    AnswerRelevancyMetric(threshold=0.5),
    # ContextualRelevancyMetric(threshold=0.7)
]

# metrics.append(
#     ToolCorrectnessMetric(
#         verbose_mode=True,
#         should_consider_ordering=True,
#         # evaluation_params=[ToolCallParams.INPUT_PARAMETERS, ToolCallParams.OUTPUT]
#     )
# )


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

metrics.append(GEval(
    name="Faithfulness (to context)",
    evaluation_steps=[
        "Check that every non-trivial claim in ACTUAL_OUTPUT is supported by CONTEXT.",
        "Penalize claims that contradict or are not supported by the context.",
        "Minor surface differences are fine; focus on factual consistency.",
    ],
    evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.CONTEXT],
    threshold=0.7,
))

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