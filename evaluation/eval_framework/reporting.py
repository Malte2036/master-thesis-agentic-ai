"""
Reporting and output formatting for evaluation results.
"""
import json
from typing import Dict, Any, List
from collections import defaultdict


def print_header(title: str, width: int = 98):
    """Print a formatted header."""
    print("\n" + "╔" + "═" * width + "╗")
    padding = (width - len(title)) // 2
    print("║" + " " * padding + title + " " * (width - padding - len(title)) + "║")
    print("╚" + "═" * width + "╝")


def print_metadata(git_hash: str, timestamp: str):
    """Print evaluation metadata."""
    print("\n" + "╔" + "═"*98 + "╗")
    print("║" + " "*35 + "EVALUATION REPORT METADATA" + " "*36 + "║")
    print("╠" + "═"*98 + "╣")
    print(f"║ {'Git Hash:':<20} {git_hash:<76} ║")
    print(f"║ {'Timestamp:':<20} {timestamp:<76} ║")
    print("╚" + "═"*98 + "╝")


def print_calibration_header():
    """Print calibration phase header."""
    print("\n" + "╔" + "═"*98 + "╗")
    print("║" + " "*28 + "CALIBRATION PHASE - FRAMEWORK VALIDATION" + " "*29 + "║")
    print("╚" + "═"*98 + "╝")
    print("\nRunning calibration tests to validate that the evaluation framework can")
    print("distinguish between perfect answers (positive controls) and flawed answers")
    print("(negative controls). This establishes the reliability of the metrics.\n")


def print_calibration_results(
    calibration_result,
    positive_controls_count: int,
    negative_controls_count: int,
    metrics: List,
    metric_thresholds: Dict[str, float],
    calibration_metadata: Dict[tuple[str, str], tuple[str, bool]]
) -> tuple[Dict[str, Any], bool]:
    """Print calibration results and return summary data.

    Args:
        calibration_result: DeepEval evaluation result
        positive_controls_count: Number of positive control tests
        negative_controls_count: Number of negative control tests
        metrics: List of metrics used
        metric_thresholds: Dict mapping metric names to thresholds
        calibration_metadata: Dict mapping (input, actual_output) to (test_name, is_positive)
    """
    print("\n" + "╔" + "═"*98 + "╗")
    print("║" + " "*35 + "CALIBRATION RESULTS" + " "*42 + "║")
    print("╚" + "═"*98 + "╝\n")

    # Count positive/negative results using metadata
    positive_passed = 0
    negative_failed = 0
    for test_result in calibration_result.test_results:
        key = (test_result.input, test_result.actual_output)
        if key in calibration_metadata:
            test_name, is_positive = calibration_metadata[key]
            if is_positive and test_result.success:
                positive_passed += 1
            elif not is_positive and not test_result.success:
                negative_failed += 1

    print(f"{'Positive Controls (should pass):':<45} {positive_passed}/{positive_controls_count}")
    print(f"{'Negative Controls (should fail):':<45} {negative_failed}/{negative_controls_count}")

    # Print detailed status for each test case
    print("\nDetailed Calibration Test Results:")
    print("─" * 100)

    for test_result in calibration_result.test_results:
        key = (test_result.input, test_result.actual_output)
        if key not in calibration_metadata:
            continue

        test_name, is_positive = calibration_metadata[key]
        status = "✓ PASS" if test_result.success else "✗ FAIL"

        # Determine expected status
        if is_positive:
            expected = "✓ PASS"
            is_correct = test_result.success
        else:
            expected = "✗ FAIL"
            is_correct = not test_result.success

        correctness = "✓" if is_correct else "⚠ UNEXPECTED"

        print(f"  {test_name:<40} Expected: {expected:<8} Got: {status:<8} {correctness}")

        # If unexpected result, show metric scores
        if not is_correct:
            print(f"    Metric scores:")
            for metric_result in test_result.metrics_data:
                metric_name = metric_result.name.replace(" [GEval]", "")
                threshold = metric_thresholds.get(metric_result.name, 0.5)
                passed = "✓" if metric_result.score >= threshold else "✗"
                print(f"      {metric_name:<35} {metric_result.score:.3f} (threshold: {threshold:.2f}) {passed}")

    print("─" * 100)

    # Calculate average scores using metadata
    positive_scores = defaultdict(list)
    negative_scores = defaultdict(list)

    for test_result in calibration_result.test_results:
        key = (test_result.input, test_result.actual_output)
        if key not in calibration_metadata:
            continue

        test_name, is_positive = calibration_metadata[key]
        for metric_result in test_result.metrics_data:
            metric_name = metric_result.name.replace(" [GEval]", "")
            if is_positive:
                positive_scores[metric_name].append(metric_result.score)
            else:
                negative_scores[metric_name].append(metric_result.score)

    print("\n" + "─" * 100)
    print(f"\n{'Metric':<45} {'Positive Avg':>15} {'Negative Avg':>15} {'Separation':>15}")
    print("─" * 100)

    for metric_name in positive_scores.keys():
        pos_avg = sum(positive_scores[metric_name]) / len(positive_scores[metric_name])
        neg_avg = sum(negative_scores[metric_name]) / len(negative_scores[metric_name])
        separation = pos_avg - neg_avg

        indicator = "✓✓" if separation > 0.7 else "✓" if separation > 0.5 else "⚠"
        print(f"{metric_name:<45} {pos_avg:>15.3f} {neg_avg:>15.3f} {separation:>14.3f} {indicator}")

    print("─" * 100)

    calibration_valid = (
        positive_passed >= positive_controls_count * 0.8 and
        negative_failed >= negative_controls_count * 0.8
    )

    if calibration_valid:
        print("\n✓ CALIBRATION SUCCESSFUL: Framework reliably distinguishes good from bad answers.")
        print("  Proceeding with main evaluation...\n")
    else:
        print("\n✗ CALIBRATION WARNING: Framework may not be reliable!")
        print("  Review metric thresholds and evaluation criteria.\n")

    print("═"*100 + "\n")

    # Prepare calibration summary
    calibration_summary = {
        "positive_controls": {
            "total": positive_controls_count,
            "passed": positive_passed,
            "pass_rate": round(positive_passed / positive_controls_count * 100, 2)
        },
        "negative_controls": {
            "total": negative_controls_count,
            "failed": negative_failed,
            "fail_rate": round(negative_failed / negative_controls_count * 100, 2)
        },
        "metrics_separation": {
            metric_name: {
                "positive_avg": round(sum(positive_scores[metric_name]) / len(positive_scores[metric_name]), 3),
                "negative_avg": round(sum(negative_scores[metric_name]) / len(negative_scores[metric_name]), 3),
                "separation": round(
                    sum(positive_scores[metric_name]) / len(positive_scores[metric_name]) -
                    sum(negative_scores[metric_name]) / len(negative_scores[metric_name]),
                    3
                )
            }
            for metric_name in positive_scores.keys()
        },
        "calibration_valid": calibration_valid
    }

    return calibration_summary, calibration_valid


def print_metrics_summary(result, metrics, metric_thresholds: Dict[str, float]):
    """Print metrics summary table."""
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

    # Calculate statistics
    print(f"\n{'Metric':<45} {'Average':>10} {'Min':>8} {'Max':>8} {'Threshold':>10} {'Pass Rate':>12}")
    print("─" * 100)

    for metric_name, scores in metric_scores.items():
        clean_name = metric_name.replace(" [GEval]", "")

        avg_score = sum(scores) / len(scores)
        min_score = min(scores)
        max_score = max(scores)
        threshold = metric_thresholds.get(metric_name, 0.5)
        pass_rate = sum(1 for s in scores if s >= threshold) / len(scores) * 100

        indicator = "✓" if pass_rate >= 70 else "✗"

        print(f"{clean_name:<45} {avg_score:>10.3f} {min_score:>8.3f} {max_score:>8.3f} {threshold:>10.2f} {pass_rate:>11.1f}% {indicator}")

    print("─" * 100)


def print_overall_stats(result, tcs):
    """Print overall test statistics."""
    total_tests = len(tcs)
    passed_tests = sum(1 for tr in result.test_results if tr.success)
    overall_pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

    print(f"\n{'Test Cases:':<30} {total_tests:>5}")
    print(f"{'Passed:':<30} {passed_tests:>5}")
    print(f"{'Failed:':<30} {total_tests - passed_tests:>5}")
    print(f"{'Overall Pass Rate:':<30} {overall_pass_rate:>5.1f}%")
    print("\n" + "═"*100 + "\n")


def detect_goal_drifting(entry: Dict[str, Any]) -> bool:
    """Detect if agent drifted from original goal."""
    trace = entry.get("trace", {})
    iteration_history = trace.get("iterationHistory", [])

    if len(iteration_history) >= 8:
        return True

    return False


def detect_loop(entry: Dict[str, Any]) -> bool:
    """Detect if agent got stuck in a loop."""
    trace = entry.get("trace", {})
    iteration_history = trace.get("iterationHistory", [])

    seen_calls = set()
    for iteration in iteration_history:
        function_calls = iteration.get("structuredThought", {}).get("functionCalls", [])
        call_signature = json.dumps(function_calls, sort_keys=True)

        if call_signature in seen_calls and call_signature != "[]":
            return True
        seen_calls.add(call_signature)

    return False


def detect_json_error(entry: Dict[str, Any]) -> bool:
    """Detect if there was a JSON parsing error."""
    trace = entry.get("trace", {})
    error = trace.get("error", "")

    if any(keyword in error.lower() for keyword in ["json", "parse", "syntax", "unexpected token"]):
        return True

    iteration_history = trace.get("iterationHistory", [])
    for iteration in iteration_history:
        thought = iteration.get("structuredThought", {})
        if "error" in thought or "Error" in str(thought):
            return True

    return False


def count_successful_steps(entry: Dict[str, Any]) -> int:
    """Count successful tool call steps."""
    trace = entry.get("trace", {})
    iteration_history = trace.get("iterationHistory", [])

    successful_steps = 0
    for iteration in iteration_history:
        function_calls = iteration.get("structuredThought", {}).get("functionCalls", [])
        for call in function_calls:
            if call.get("result") and "error" not in str(call.get("result", "")).lower():
                successful_steps += 1

    return successful_steps


def extract_common_errors(entries: List[Dict[str, Any]], limit: int = 3) -> List[str]:
    """Extract most common error messages."""
    error_counts = defaultdict(int)

    for entry in entries:
        trace = entry.get("trace", {})
        error = trace.get("error", "")

        if error:
            simplified = error.split("\n")[0][:100]
            error_counts[simplified] += 1

    sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
    return [error for error, count in sorted_errors[:limit]]


def print_task_type_analysis(result, entries, metrics, metric_thresholds: Dict[str, float]):
    """Print task type breakdown analysis."""
    print("\n" + "╔" + "═"*98 + "╗")
    print("║" + " "*35 + "TASK TYPE BREAKDOWN" + " "*42 + "║")
    print("╚" + "═"*98 + "╝\n")

    # Group entries by task type
    entries_by_type = defaultdict(list)
    for entry in entries:
        task_type = entry.get("task_type", "unknown")
        entries_by_type[task_type].append(entry)

    # Map test results to entries
    test_result_map = {}
    for i, test_result in enumerate(result.test_results):
        if i < len(entries):
            entry_id = entries[i].get("id", f"test_{i}")
            test_result_map[entry_id] = test_result

    # Analyze by task type
    categories_report = {}
    failure_analysis = {
        "goal_drifting_count": 0,
        "loop_count": 0,
        "json_error_count": 0,
        "faithfulness_fail": 0,
    }

    # Find Faithfulness metric name
    faithfulness_metric_name = None
    for metric_name in [m.name if hasattr(m, 'name') else m.__class__.__name__ for m in metrics]:
        if "Faithfulness" in metric_name or "faithfulness" in metric_name.lower():
            faithfulness_metric_name = metric_name
            break

    for task_type, type_entries in entries_by_type.items():
        n = len(type_entries)
        passed = 0
        total_steps = 0
        failed_entries = []

        for entry in type_entries:
            entry_id = entry.get("id", "")
            test_result = test_result_map.get(entry_id)

            if test_result and test_result.success:
                passed += 1

            steps = count_successful_steps(entry)
            total_steps += steps

            if detect_goal_drifting(entry):
                failure_analysis["goal_drifting_count"] += 1

            if detect_loop(entry):
                failure_analysis["loop_count"] += 1

            if detect_json_error(entry):
                failure_analysis["json_error_count"] += 1

            if test_result and faithfulness_metric_name:
                for metric_result in test_result.metrics_data:
                    if metric_result.name == faithfulness_metric_name:
                        threshold = metric_thresholds.get(faithfulness_metric_name, 0.7)
                        if metric_result.score < threshold:
                            failure_analysis["faithfulness_fail"] += 1

            if not (test_result and test_result.success):
                failed_entries.append(entry)

        pass_rate = (passed / n * 100) if n > 0 else 0
        avg_steps = (total_steps / n) if n > 0 else 0
        common_errors = extract_common_errors(failed_entries, limit=3)

        categories_report[task_type] = {
            "n": n,
            "passed": passed,
            "pass_rate_percent": round(pass_rate, 2),
            "avg_steps_success": round(avg_steps, 2),
            "common_errors": common_errors,
        }

        print(f"Task Type: {task_type}")
        print(f"  Total Tests: {n}")
        print(f"  Passed: {passed}")
        print(f"  Pass Rate: {pass_rate:.1f}%")
        print(f"  Avg Successful Steps: {avg_steps:.2f}")
        if common_errors:
            print(f"  Common Errors:")
            for i, error in enumerate(common_errors, 1):
                print(f"    {i}. {error}")
        print()

    print("─" * 100)
    print("\nFailure Analysis:")
    print(f"  Goal Drifting: {failure_analysis['goal_drifting_count']}")
    print(f"  Loop Detection: {failure_analysis['loop_count']}")
    print(f"  JSON Errors: {failure_analysis['json_error_count']}")
    print(f"  Faithfulness Fails: {failure_analysis['faithfulness_fail']}")
    print("\n" + "═"*100 + "\n")

    return categories_report, failure_analysis


def save_json_report(
    output_path: str,
    total_tests: int,
    overall_pass_rate: float,
    calibration_summary: Dict[str, Any],
    categories_report: Dict[str, Any],
    failure_analysis: Dict[str, Any]
):
    """Save JSON report to file."""
    json_report = {
        "summary": {
            "total_tests": total_tests,
            "overall_pass_rate": round(overall_pass_rate, 2),
        },
        "calibration": calibration_summary,
        "categories": categories_report,
        "failure_analysis": failure_analysis,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2, ensure_ascii=False)

    print(f"✓ Report saved to: {output_path}\n")
