#!/usr/bin/env python3
"""
Main evaluation script for comparing different agent configurations.
Evaluates multiple experiments (e.g., with/without TODO list) and outputs comparative results.
"""
import os
from deepeval import evaluate
from deepeval.evaluate import DisplayConfig

from eval_framework import (
    EXPERIMENTS,
    RUN_CALIBRATION,
    CALIBRATION_OUTPUT_DIR,
    get_test_cases,
    get_calibration_test_cases,
    load_report_data,
    get_metrics,
    print_header,
    print_metadata,
    print_calibration_header,
    print_calibration_results,
    print_metrics_summary,
    print_overall_stats,
    print_task_type_analysis,
    save_json_report,
)


def run_calibration(metrics):
    """Run calibration phase to validate evaluation framework."""
    print_calibration_header()

    # Get calibration test cases with metadata (name, is_positive, test_case)
    calibration_data = get_calibration_test_cases()

    # Extract test cases for evaluation
    test_cases = [tc for name, is_positive, tc in calibration_data]

    # Create metadata map for reporting using (input, actual_output) as key
    # This uniquely identifies each calibration test case
    calibration_metadata = {
        (tc.input, tc.actual_output): (name, is_positive)
        for name, is_positive, tc in calibration_data
    }

    calibration_result = evaluate(
        display_config=DisplayConfig(file_output_dir=CALIBRATION_OUTPUT_DIR),
        test_cases=test_cases,
        metrics=metrics
    )

    # Calculate metric thresholds
    metric_thresholds = {}
    for metric in metrics:
        metric_name = getattr(metric, 'name', metric.__class__.__name__)
        metric_thresholds[metric_name] = metric.threshold

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

    return calibration_summary, calibration_valid, metric_thresholds


def run_experiment_evaluation(config, metrics, metric_thresholds):
    """Run evaluation for a single experiment configuration."""
    print_header(f"EVALUATING: {config.name}")
    print(f"Description: {config.description}")
    print(f"Report: {config.report_path}\n")

    # Check if report file exists
    if not os.path.exists(config.report_path):
        print(f"⚠ Warning: Report file not found: {config.report_path}")
        print(f"  Skipping evaluation for '{config.name}'\n")
        return None

    # Load report data
    report_data = load_report_data(config.report_path)
    git_hash = report_data.get("gitHash", "N/A")
    timestamp = report_data.get("timestamp", "N/A")

    print_metadata(git_hash, timestamp)

    # Get test cases and run evaluation
    tcs = get_test_cases(report_data)
    result = evaluate(
        display_config=DisplayConfig(file_output_dir=config.output_dir),
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

    return {
        "config": config,
        "total_tests": total_tests,
        "passed_tests": passed_tests,
        "overall_pass_rate": overall_pass_rate,
        "categories_report": categories_report,
        "failure_analysis": failure_analysis,
    }


def print_comparative_summary(experiment_results):
    """Print comparative summary across all experiments."""
    print_header("COMPARATIVE SUMMARY")

    print(f"\n{'Experiment':<40} {'Total Tests':>15} {'Pass Rate':>15}")
    print("─" * 100)

    for result in experiment_results:
        if result is None:
            continue
        config = result["config"]
        print(f"{config.name:<40} {result['total_tests']:>15} {result['overall_pass_rate']:>14.1f}%")

    print("─" * 100)

    # Find best performing experiment
    valid_results = [r for r in experiment_results if r is not None]
    if valid_results:
        best = max(valid_results, key=lambda x: x['overall_pass_rate'])
        print(f"\n✓ Best performing: {best['config'].name} ({best['overall_pass_rate']:.1f}%)")

    print("\n" + "═"*100 + "\n")


def main():
    """Main evaluation entry point."""
    print_header("AGENT EVALUATION - COMPARATIVE ANALYSIS")

    # Get metrics
    metrics = get_metrics()

    # Calculate metric thresholds
    metric_thresholds = {}
    for metric in metrics:
        metric_name = getattr(metric, 'name', metric.__class__.__name__)
        metric_thresholds[metric_name] = metric.threshold

    # Run calibration if enabled
    calibration_summary = None
    calibration_valid = True

    if RUN_CALIBRATION:
        calibration_summary, calibration_valid, metric_thresholds = run_calibration(metrics)

        if not calibration_valid:
            print("⚠ WARNING: Calibration failed. Results may not be reliable.")
            print("  Consider reviewing metric definitions and thresholds.\n")

    # Run evaluations for each experiment
    experiment_results = []
    for config in EXPERIMENTS:
        result = run_experiment_evaluation(config, metrics, metric_thresholds)
        experiment_results.append(result)

        # Save individual report
        if result is not None:
            output_path = f"{config.output_dir}/analysis.json"
            os.makedirs(config.output_dir, exist_ok=True)
            save_json_report(
                output_path,
                result["total_tests"],
                result["overall_pass_rate"],
                calibration_summary or {},
                result["categories_report"],
                result["failure_analysis"],
            )

    # Print comparative summary
    print_comparative_summary(experiment_results)

    print("✓ All evaluations complete!")


if __name__ == "__main__":
    main()
