import json
from typing import Iterable, List, Any, Dict, Optional
from deepeval import evaluate
from deepeval.test_case import LLMTestCase, LLMTestCaseParams, ToolCall, ToolCallParams
from deepeval.metrics import GEval, AnswerRelevancyMetric, ContextualRelevancyMetric,ToolCorrectnessMetric, TaskCompletionMetric
from deepeval.evaluate import DisplayConfig


def get_expected_tool_calls(e: Dict[str, Any]) -> List[ToolCall]:
    tool_calls = []
    for tool_call in e.get("expected_tool_calls", []):
        tool_calls.append(ToolCall(
            name=tool_call.get("function"),
            input_parameters=tool_call.get("args"),
        ))
    return tool_calls

def get_tools_called(e: Dict[str, Any], prefix: str | None = None) -> List[ToolCall]:
    if e is None:
        return []

    tool_calls = []
    
    iteration_history = e.get("iterationHistory", [])
    for iteration in iteration_history:
        for function_call in iteration.get("structuredThought").get("functionCalls", []):
            if function_call.get("type") == "agent":
                tool_calls.extend(
                    get_tools_called(function_call.get("internalRouterProcess", {}), prefix=function_call.get("function"))
                )
            
            if function_call.get("type") == "mcp":
                function_name = f"{prefix}.{function_call.get('function')}" if prefix else function_call.get("function")
                tool_calls.append(ToolCall(
                    name=function_name,
                    input_parameters=function_call.get("args"),
                ))

    return tool_calls

def get_context(e: Dict[str, Any]) -> List[str]:
    if e is None:
        return []

    context = []
    
    iteration_history = e.get("iterationHistory", [])
    for iteration in iteration_history:
        for function_call in iteration.get("structuredThought").get("functionCalls", []):
            if function_call.get("type") == "agent":
                context.extend(
                    get_context(function_call.get("internalRouterProcess", {}))
                )
            
            if function_call.get("type") == "mcp":
                context.append(function_call.get("result"))

    return context

def get_test_cases(data: Optional[Dict[str, Any]] = None, path: str = "./report/report.json") -> List[LLMTestCase]:
    if data is None:
        data = json.load(open(path, "r", encoding="utf-8"))
    entries = data.get("testEntries", data if isinstance(data, list) else [])
    tcs = []
    for e in entries:
        trace = e.get("trace", {})
         # Add default context
        context = [x.get("description") for x in trace.get("agentTools", [])]
        context.extend(get_context(trace))

        tool_calls = get_tools_called(trace)
        
        input = e["input"]
        if e.get("extended_evaluation_input"):
            input += f"\n\n{e.get('extended_evaluation_input')}"

        tc = LLMTestCase(
            input=input,
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),   # optional
            context=context,                      # must be List[str]
            completion_time=e.get("completion_time"),
            expected_tools=get_expected_tool_calls(e),
            tools_called=tool_calls,
        )
        tcs.append(tc)
    
    return tcs

def load_report_data(path: str = "./report/report.json") -> Dict[str, Any]:
    """Load report data and return it along with metadata."""
    return json.load(open(path, "r", encoding="utf-8"))

metrics = [
    AnswerRelevancyMetric(threshold=0.5),
    # ContextualRelevancyMetric(threshold=0.7)
    TaskCompletionMetric(threshold=0.7)
]

# metrics.append(
#     ToolCorrectnessMetric(
#         verbose_mode=True,
#         should_consider_ordering=True,
#         # evaluation_params=[ToolCallParams.INPUT_PARAMETERS, ToolCallParams.OUTPUT]
#     )
# )




metrics.append(GEval(
    name="Faithfulness (to context)",
    evaluation_steps=[
        "Check that every non-trivial claim in ACTUAL_OUTPUT is supported by CONTEXT.",
        "Penalize claims that contradict or are not supported by the context.",
        "Minor surface differences are fine; focus on factual consistency.",
        "Compare ACTUAL_OUTPUT to EXPECTED_OUTPUT. Mark as incorrect if any required fact in EXPECTED_OUTPUT is missing or wrong.",
        "Paraphrasing is fine; factual content must match.",
    ],
    evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT, LLMTestCaseParams.CONTEXT],
    threshold=0.7,
))

metrics.append(GEval(
    name="Goal Satisfaction",
    evaluation_steps=[
        "Analyze the user's INPUT to identify the explicit goal or request (e.g., create a calendar event, answer a question, retrieve information).",
        "Evaluate whether the ACTUAL_OUTPUT directly addresses and fulfills the user's goal from INPUT.",
        "If EXPECTED_TOOL_CALLS are provided, verify that the necessary actions/tools were executed to accomplish the goal.",
        "Check that the ACTUAL_OUTPUT contains the expected result or confirmation of task completion (not just partial information or acknowledgments).",
        "Penalize if: (1) the output doesn't directly answer the user's question, (2) the output is vague or incomplete, (3) expected tool calls were not executed when required, or (4) the output indicates failure or inability to complete the task.",
        "Reward clear, complete responses that demonstrate successful goal completion with appropriate action execution.",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_TOOLS, LLMTestCaseParams.TOOLS_CALLED],
    threshold=0.7,
))

metrics.append(GEval(
    name="Format Compliance",
    evaluation_steps=[
        "Analyze the INPUT to determine if a specific format or structure is explicitly requested (e.g., Markdown sections, APA/MLA citation style, bulleted lists, deliverables list, JSON, etc.).",
        "If no format is specified in INPUT, consider the response format compliant (score highly) as there is no format requirement to violate.",
        "If the ACTUAL_OUTPUT appropriately acknowledges inability to fulfill the request (e.g., explains lack of tools, missing information, or capability limitations), consider it format compliant when no specific format was requested.",
        "If a format IS specified in INPUT, verify that ACTUAL_OUTPUT respects that format (e.g., uses requested Markdown structure, follows citation style, adheres to list format, etc.).",
        "CRITICAL: Before penalizing any data in ACTUAL_OUTPUT, FIRST check if that data appears in CONTEXT. If the data (like names, usernames, course names, assignment titles, dates, etc.) is present in CONTEXT, it is legitimate user-facing data and should NOT be penalized as internal artifacts.",
        "CRITICAL: Check that ACTUAL_OUTPUT contains NO internal data or artifacts: (1) NO evidence-json blocks, (2) NO DONE:/CALL: markers, (3) NO internal reasoning artifacts, (4) NO internal IDs (like course IDs, assignment IDs, user IDs) unless explicitly requested by the user OR unless the ID is necessary to identify content that appears in CONTEXT, (5) NO internal agent/tool names (like 'moodle-agent' or 'calendar-agent'), (6) NO raw JSON or internal state data, (7) NO stack traces or error logs, (8) NO timestamps in ISO format (e.g., '2025-01-15T10:30:00Z' or '2025-01-15T10:30:00.000Z'). Dates should be presented in user-friendly formats only. The output must be pure, natural language user-facing content only.",
        "CRITICAL: Verify that the language of ACTUAL_OUTPUT matches the language of INPUT. If INPUT is in a specific language (e.g., German, French, Spanish), ACTUAL_OUTPUT must be in the same language. Penalize heavily if the output language does not match the input language.",
        "Penalize heavily if any internal data, IDs, or reasoning artifacts appear in ACTUAL_OUTPUT that are NOT present in CONTEXT, even if format is otherwise correct.",
        "Only penalize format violations when a specific format was explicitly requested in INPUT and the response fails to follow it.",
        "Reward responses that follow requested formats, appropriately acknowledge limitations when no format is required, contain no internal data or artifacts (except legitimate data from CONTEXT), and match the input language.",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.CONTEXT],
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

# Load report data
report_data = load_report_data()
git_hash = report_data.get("gitHash", "N/A")
timestamp = report_data.get("timestamp", "N/A")

# Print git hash and timestamp as first values
print("\n" + "╔" + "═"*98 + "╗")
print("║" + " "*35 + "EVALUATION REPORT METADATA" + " "*36 + "║")
print("╠" + "═"*98 + "╣")
print(f"║ {'Git Hash:':<20} {git_hash:<76} ║")
print(f"║ {'Timestamp:':<20} {timestamp:<76} ║")
print("╚" + "═"*98 + "╝")

tcs = get_test_cases(report_data)
result = evaluate(display_config=DisplayConfig(file_output_dir="./report/evaluation_report"),test_cases=tcs, metrics=metrics)

# Print metrics table
print("\n" + "╔" + "═"*98 + "╗")
print("║" + " "*35 + "EVALUATION METRICS SUMMARY" + " "*37 + "║")
print("╚" + "═"*98 + "╝")

# Collect metric scores
metric_scores = {}
for test_result in result.test_results:
    for metric_result in test_result.metrics_data:
        metric_name = metric_result.name
        if metric_name not in metric_scores:
            metric_scores[metric_name] = []
        metric_scores[metric_name].append(metric_result.score)

# Create a mapping of metric names to thresholds
metric_thresholds = {}
for metric in metrics:
    metric_name = getattr(metric, 'name', metric.__class__.__name__)
    metric_thresholds[metric_name] = metric.threshold

# Calculate statistics
print(f"\n{'Metric':<45} {'Average':>10} {'Min':>8} {'Max':>8} {'Threshold':>10} {'Pass Rate':>12}")
print("─" * 100)

for metric_name, scores in metric_scores.items():
    # Clean up metric name (remove [GEval] tag)
    clean_name = metric_name.replace(" [GEval]", "")
    
    avg_score = sum(scores) / len(scores)
    min_score = min(scores)
    max_score = max(scores)
    threshold = metric_thresholds.get(metric_name, 0.5)
    pass_rate = sum(1 for s in scores if s >= threshold) / len(scores) * 100
    
    # Add visual indicator for pass/fail
    indicator = "✓" if pass_rate >= 70 else "✗"
    
    print(f"{clean_name:<45} {avg_score:>10.3f} {min_score:>8.3f} {max_score:>8.3f} {threshold:>10.2f} {pass_rate:>11.1f}% {indicator}")

print("─" * 100)

# Calculate overall statistics
total_tests = len(tcs)
passed_tests = sum(1 for tr in result.test_results if tr.success)
overall_pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

print(f"\n{'Test Cases:':<30} {total_tests:>5}")
print(f"{'Passed:':<30} {passed_tests:>5}")
print(f"{'Failed:':<30} {total_tests - passed_tests:>5}")
print(f"{'Overall Pass Rate:':<30} {overall_pass_rate:>5.1f}%")
print("\n" + "═"*100 + "\n")

