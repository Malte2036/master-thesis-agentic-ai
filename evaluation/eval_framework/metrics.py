"""
Metrics definitions for evaluation.
"""
from typing import List
from deepeval.metrics import GEval, AnswerRelevancyMetric, TaskCompletionMetric
from deepeval.test_case import LLMTestCaseParams
from deepeval.metrics.base_metric import BaseMetric
from deepeval.models import GPTModel

from .config import (
    ANSWER_RELEVANCY_THRESHOLD,
    TASK_COMPLETION_THRESHOLD,
    FAITHFULNESS_THRESHOLD,
    GOAL_SATISFACTION_THRESHOLD,
    FORMAT_COMPLIANCE_THRESHOLD,
)


def get_metrics() -> List[BaseMetric]:

    metrics = [
        AnswerRelevancyMetric(threshold=ANSWER_RELEVANCY_THRESHOLD),
        TaskCompletionMetric(threshold=TASK_COMPLETION_THRESHOLD)
    ]

    # Faithfulness metric - uses reasoning_judge to catch subtle hallucinations
    metrics.append(GEval(
        name="Faithfulness (to context)",
        evaluation_steps=[
            "Check that every non-trivial claim in ACTUAL_OUTPUT is supported by CONTEXT.",
            "CRITICAL: If ACTUAL_OUTPUT contains ANY information that is NOT present in CONTEXT, heavily penalize. Score should be < 0.2 for any unsupported claim.",
            "CRITICAL: Look for hallucinations - fabricated information that appears nowhere in CONTEXT. Examples of hallucinations: lottery wins, unexpected money, requests for payment, locations not mentioned in context, events not in context, any financial or personal information not in context.",
            "CRITICAL: If ACTUAL_OUTPUT mentions prizes, lottery, money transfers, processing fees, or any financial transactions that are NOT in CONTEXT, score must be 0.0 (complete hallucination).",
            "Penalize claims that contradict or are not supported by the context.",
            "Compare ACTUAL_OUTPUT to EXPECTED_OUTPUT. Mark as incorrect if any required fact in EXPECTED_OUTPUT is missing or wrong.",
            "Minor surface differences (paraphrasing, formatting) are acceptable, but factual content must match exactly.",
            "If ACTUAL_OUTPUT contains the correct information from EXPECTED_OUTPUT but ALSO contains fabricated information not in CONTEXT, score should be < 0.3 (mixed correct and hallucinated content).",
        ],
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT, LLMTestCaseParams.CONTEXT],
        threshold=FAITHFULNESS_THRESHOLD,
    ))

    # Goal Satisfaction metric - uses reasoning_judge for complex tool verification
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
        threshold=GOAL_SATISFACTION_THRESHOLD,
    ))

    # Format Compliance metric - uses reasoning_judge to distinguish internal IDs from context data
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
        threshold=FORMAT_COMPLIANCE_THRESHOLD,
    ))

    return metrics
