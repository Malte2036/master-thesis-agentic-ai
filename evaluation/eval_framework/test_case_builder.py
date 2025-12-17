"""
Test case builders for evaluation.
Handles creation of test cases from report data and calibration samples.
"""
import json
from typing import List, Dict, Any, Optional
from deepeval.test_case import LLMTestCase, ToolCall

from .config import EVALUATION_CURRENT_DATE


def get_expected_tool_calls(e: Dict[str, Any]) -> List[ToolCall]:
    """Extract expected tool calls from test entry."""
    tool_calls = []
    for tool_call in e.get("expected_tool_calls", []):
        tool_calls.append(ToolCall(
            name=tool_call.get("function"),
            input_parameters=tool_call.get("args"),
        ))
    return tool_calls


def get_tools_called(e: Dict[str, Any], prefix: str | None = None) -> List[ToolCall]:
    """Extract actual tools called from trace."""
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
    """Extract context from trace."""
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


def get_calibration_test_cases() -> List[tuple[str, bool, LLMTestCase]]:
    """
    Generate hardcoded calibration test cases to validate the evaluation framework.
    These are 'sanity checks' that prove the metrics can distinguish between:
    - Positive Control: Perfect answers (should score ~1.0)
    - Negative Control: Flawed/hallucinated answers (should score ~0.0)

    Returns:
        List of tuples: (test_name, is_positive_control, test_case)
    """
    calibration_cases = []

    # POSITIVE CONTROL A: Perfect Answer
    calibration_cases.append((
        "POSITIVE A: Perfect Answer",
        True,  # is_positive_control
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    # POSITIVE CONTROL B: Perfect Multi-Step Answer
    calibration_cases.append((
        "POSITIVE B: Perfect Multi-Step",
        True,
        LLMTestCase(
        input="Erstelle einen Kalendereintrag für die Abgabe 'Übungsblatt 1' in Verteilte Systeme am 14.12.2025 um 23:59 Uhr.",
        actual_output="Ich habe den Kalendereintrag 'Verteilte Systeme - Übungsblatt 1' für den 14. Dezember 2025 um 23:59 Uhr erstellt.",
        expected_output="Kalendereintrag erstellt für 'Verteilte Systeme - Übungsblatt 1' am 14.12.2025 um 23:59 Uhr.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z",
            "Calendar event created successfully with ID: cal_123"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            })
        ],
        tools_called=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            })
        ],
    )))

    # NEGATIVE CONTROL A: Hallucination
    calibration_cases.append((
        "NEGATIVE A: Hallucination",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die Klausur findet morgen im Hörsaal A statt und Sie haben übrigens 1000 Euro im Lotto gewonnen! Bitte überweisen Sie 50 Euro Bearbeitungsgebühr.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[],
    )))

    # NEGATIVE CONTROL B: Format Violation
    calibration_cases.append((
        "NEGATIVE B: Format Violation",
        False,
        LLMTestCase(
        input="Gib mir die Details zur Abgabe als saubere Antwort.",
        actual_output="""CALL: moodle-agent.get_assignment
evidence-json: {"course_id": "12345", "assignment_id": "67890", "internal_state": "processing"}
DONE: Retrieved assignment data
Die Abgabe ist am 2025-12-14T23:59:00.000Z (ISO-timestamp)
DEBUG: Function completed successfully with trace_id=abc123""",
        expected_output="Die Abgabe für Übungsblatt 1 ist am 14. Dezember 2025 um 23:59 Uhr.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"})
        ],
    )))

    # NEGATIVE CONTROL C: Wrong Tool Usage
    calibration_cases.append((
        "NEGATIVE C: Wrong Tool Usage",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Ich konnte keine Information finden.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="calendar.list_events", input_parameters={}),
            ToolCall(name="weather.get_forecast", input_parameters={"city": "Berlin"})
        ],
    )))

    # NEGATIVE CONTROL D: Language Mismatch
    calibration_cases.append((
        "NEGATIVE D: Language Mismatch",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="The next assignment 'Übungsblatt 1' is due on December 14, 2025.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    # POSITIVE CONTROL C: Partial Match but Semantically Correct
    calibration_cases.append((
        "POSITIVE C: Partial Match Semantically Correct",
        True,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die nächste Abgabe für Verteilte Systeme ist Übungsblatt 1, fällig am 14.12.2025.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    # POSITIVE CONTROL D: Complex Query with Correct Reasoning
    calibration_cases.append((
        "POSITIVE D: Complex Query Correct Reasoning",
        True,
        LLMTestCase(
        input="Zeige mir alle kommenden Abgaben und erstelle Kalendereinträge für die nächsten drei.",
        actual_output="Ich habe die folgenden Abgaben gefunden: Übungsblatt 1 (14.12.2025), Übungsblatt 2 (21.12.2025), Übungsblatt 3 (28.12.2025). Kalendereinträge wurden für alle drei erstellt.",
        expected_output="Abgaben gefunden: Übungsblatt 1 (14.12.2025), Übungsblatt 2 (21.12.2025), Übungsblatt 3 (28.12.2025). Kalendereinträge erstellt.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignments: Übungsblatt 1 (2025-12-14), Übungsblatt 2 (2025-12-21), Übungsblatt 3 (2025-12-28)",
            "Calendar events created: cal_123, cal_124, cal_125"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 1", "date": "2025-12-14"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 2", "date": "2025-12-21"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 3", "date": "2025-12-28"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 1", "date": "2025-12-14"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 2", "date": "2025-12-21"}),
            ToolCall(name="calendar.create_event", input_parameters={"title": "Verteilte Systeme - Übungsblatt 3", "date": "2025-12-28"})
        ],
    )))

    # NEGATIVE CONTROL E: Correct Tools but Wrong Parameters
    calibration_cases.append((
        "NEGATIVE E: Wrong Parameters",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die nächste Abgabe ist 'Übungsblatt 2' am 21. Dezember 2025.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Datenbanken"})
        ],
    )))

    # NEGATIVE CONTROL F: Partial Tool Match
    calibration_cases.append((
        "NEGATIVE F: Partial Tool Match",
        False,
        LLMTestCase(
        input="Erstelle einen Kalendereintrag für die Abgabe 'Übungsblatt 1' in Verteilte Systeme am 14.12.2025 um 23:59 Uhr.",
        actual_output="Ich habe versucht, den Kalendereintrag zu erstellen, aber es gab ein Problem.",
        expected_output="Kalendereintrag erstellt für 'Verteilte Systeme - Übungsblatt 1' am 14.12.2025 um 23:59 Uhr.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            })
        ],
        tools_called=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.list_events", input_parameters={})
        ],
    )))

    # NEGATIVE CONTROL G: Correct Tools but Wrong Order
    calibration_cases.append((
        "NEGATIVE G: Wrong Tool Order",
        False,
        LLMTestCase(
        input="Erstelle einen Kalendereintrag für die Abgabe 'Übungsblatt 1' in Verteilte Systeme am 14.12.2025 um 23:59 Uhr.",
        actual_output="Kalendereintrag erstellt, aber Details fehlen noch.",
        expected_output="Kalendereintrag erstellt für 'Verteilte Systeme - Übungsblatt 1' am 14.12.2025 um 23:59 Uhr.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            })
        ],
        tools_called=[
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            }),
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"})
        ],
    )))

    # NEGATIVE CONTROL H: Empty Output
    calibration_cases.append((
        "NEGATIVE H: Empty Output",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    # NEGATIVE CONTROL I: Off-Topic but Plausible Answer
    calibration_cases.append((
        "NEGATIVE I: Off-Topic Plausible Answer",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die nächste Vorlesung findet am Montag, den 15. Dezember 2025 um 10:00 Uhr statt.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_course_schedule", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    # NEGATIVE CONTROL J: Missing Required Tool Calls
    calibration_cases.append((
        "NEGATIVE J: Missing Required Tool Calls",
        False,
        LLMTestCase(
        input="Erstelle einen Kalendereintrag für die Abgabe 'Übungsblatt 1' in Verteilte Systeme am 14.12.2025 um 23:59 Uhr.",
        actual_output="Ich habe versucht, die Informationen zu finden, aber konnte den Kalendereintrag nicht erstellen.",
        expected_output="Kalendereintrag erstellt für 'Verteilte Systeme - Übungsblatt 1' am 14.12.2025 um 23:59 Uhr.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"}),
            ToolCall(name="calendar.create_event", input_parameters={
                "title": "Verteilte Systeme - Übungsblatt 1",
                "date": "2025-12-14",
                "time": "23:59"
            })
        ],
        tools_called=[
            ToolCall(name="moodle.get_assignment_details", input_parameters={"assignment_name": "Übungsblatt 1"})
        ],
    )))

    # NEGATIVE CONTROL K: Factually Incorrect but Well-Formatted
    calibration_cases.append((
        "NEGATIVE K: Factually Incorrect",
        False,
        LLMTestCase(
        input="Wann ist die nächste Abgabe für Verteilte Systeme?",
        actual_output="Die nächste Abgabe ist 'Übungsblatt 5' am 30. Dezember 2025.",
        expected_output="Die nächste Abgabe ist 'Übungsblatt 1' am 14. Dezember 2025.",
        context=[
            f"Current date for evaluation: {EVALUATION_CURRENT_DATE}",
            "Course: Verteilte Systeme",
            "Assignment: Übungsblatt 1",
            "Due date: 2025-12-14T23:59:00Z"
        ],
        expected_tools=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
        tools_called=[
            ToolCall(name="moodle.get_upcoming_assignments", input_parameters={"course_name": "Verteilte Systeme"})
        ],
    )))

    return calibration_cases


def get_test_cases(data: Optional[Dict[str, Any]] = None, path: str = "./report/report.json") -> List[LLMTestCase]:
    """Load test cases from report JSON file."""
    if data is None:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

    entries = data.get("testEntries", data if isinstance(data, list) else [])
    tcs = []

    for e in entries:
        trace = e.get("trace", {})
        # Add default context
        context = [x.get("description") for x in trace.get("agentTools", [])]
        context.extend(get_context(trace))

        tool_calls = get_tools_called(trace)

        input_text = e["input"]
        if e.get("extended_evaluation_input"):
            input_text += f"\n\n{e.get('extended_evaluation_input')}"

        tc = LLMTestCase(
            input=input_text,
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),
            context=context,
            completion_time=e.get("completion_time"),
            expected_tools=get_expected_tool_calls(e),
            tools_called=tool_calls,
        )
        tcs.append(tc)

    return tcs


def load_report_data(path: str) -> Dict[str, Any]:
    """Load report data from JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
