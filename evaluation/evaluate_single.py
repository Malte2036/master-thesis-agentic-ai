#!/usr/bin/env python3
"""
Single evaluation script (legacy compatibility).
Evaluates a single report file with calibration.
"""
import sys
from deepeval import evaluate
from deepeval.evaluate import DisplayConfig

from eval_framework import (
    RUN_CALIBRATION,
    CALIBRATION_OUTPUT_DIR,
    get_test_cases,
    get_calibration_test_cases,
    load_report_data,
    get_metrics,
    print_metadata,
    print_calibration_header,
    print_calibration_results,
    print_metrics_summary,
    print_overall_stats,
    print_task_type_analysis,
    save_json_report,
)


def main():
    """Main evaluation entry point for single report."""
    # Get report path from command line or use default
    report_path = sys.argv[1] if len(sys.argv) > 1 else "./report/report.json"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./report/evaluation_report"

    # Get metrics
    metrics = get_metrics()

    # Calculate metric thresholds
    metric_thresholds = {}
    for metric in metrics:
        metric_name = getattr(metric, 'name', metric.__class__.__name__)
        metric_thresholds[metric_name] = metric.threshold

    # Run calibration if enabled
    calibration_summary = None

    if RUN_CALIBRATION:
        print_calibration_header()

        # Get calibration test cases with metadata (name, is_positive, test_case)
        calibration_data = get_calibration_test_cases()

        # Extract test cases for evaluation
        test_cases = [tc for name, is_positive, tc in calibration_data]

        # Create metadata map for reporting using (input, actual_output) as key
        # (handles async execution order and duplicate inputs)
        calibration_metadata = {
            (tc.input, tc.actual_output): (name, is_positive)
            for name, is_positive, tc in calibration_data
        }

        calibration_result = evaluate(
            display_config=DisplayConfig(file_output_dir=CALIBRATION_OUTPUT_DIR),
            test_cases=test_cases,
            metrics=metrics
        )

        positive_controls_count = sum(1 for name, is_pos, tc in calibration_data if is_pos)
        negative_controls_count = sum(1 for name, is_pos, tc in calibration_data if not is_pos)

        calibration_summary, calibration_valid = print_calibration_results(
            calibration_result,
            positive_controls_count,
            negative_controls_count,
            metrics,
            metric_thresholds,
            calibration_metadata
        )

        if not calibration_valid:
            print("⚠ WARNING: Calibration failed. Results may not be reliable.")

    # Load report data
    report_data = load_report_data(report_path)
    git_hash = report_data.get("gitHash", "N/A")
    timestamp = report_data.get("timestamp", "N/A")

    print_metadata(git_hash, timestamp)

    # Get test cases and run evaluation
    tcs = get_test_cases(report_data)
    result = evaluate(
        display_config=DisplayConfig(file_output_dir=output_dir),
        test_cases=tcs,
        metrics=metrics
    )

    # Print results
    print_metrics_summary(result, metrics, metric_thresholds)
    print_overall_stats(result, tcs)

    entries = report_data.get("testEntries", [])
    categories_report, failure_analysis = print_task_type_analysis(
        result, entries, metrics, metric_thresholds
    )

    # Calculate overall stats
    total_tests = len(tcs)
    passed_tests = sum(1 for tr in result.test_results if tr.success)
    overall_pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

    # Save report
    output_path = f"{output_dir}/analysis.json"
    save_json_report(
        output_path,
        total_tests,
        overall_pass_rate,
        calibration_summary or {},
        categories_report,
        failure_analysis,
    )

    print("✓ Evaluation complete!")


if __name__ == "__main__":
    main()
