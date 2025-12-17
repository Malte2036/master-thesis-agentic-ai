"""
Evaluation framework for agent experiments.
"""
from .config import EXPERIMENTS, RUN_CALIBRATION, CALIBRATION_OUTPUT_DIR
from .metrics import get_metrics
from .test_case_builder import get_test_cases, get_calibration_test_cases, load_report_data
from .reporting import (
    print_header,
    print_metadata,
    print_calibration_header,
    print_calibration_results,
    print_metrics_summary,
    print_overall_stats,
    print_task_type_analysis,
    save_json_report,
)

__all__ = [
    'EXPERIMENTS',
    'RUN_CALIBRATION',
    'CALIBRATION_OUTPUT_DIR',
    'get_metrics',
    'get_test_cases',
    'get_calibration_test_cases',
    'load_report_data',
    'print_header',
    'print_metadata',
    'print_calibration_header',
    'print_calibration_results',
    'print_metrics_summary',
    'print_overall_stats',
    'print_task_type_analysis',
    'save_json_report',
]
