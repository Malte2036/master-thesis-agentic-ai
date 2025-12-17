"""
Configuration for evaluation experiments.

Usage:
    # Evaluate both configurations (with/without TODO):
    python evaluate_experiments.py

    # Evaluate a single report:
    python evaluate_single.py ./report/report.json ./report/output_dir

Modify EXPERIMENTS list below to add/remove configurations to compare.
"""
from dataclasses import dataclass
from typing import List


@dataclass
class EvaluationConfig:
    """Configuration for a single evaluation run."""
    name: str
    report_path: str
    output_dir: str
    description: str


# ═══════════════════════════════════════════════════════════════════════════════
# EXPERIMENTS TO EVALUATE
# ═══════════════════════════════════════════════════════════════════════════════
# Add your experiment configurations here. The script will evaluate each one
# and generate a comparative summary.

EXPERIMENTS: List[EvaluationConfig] = [
    # EvaluationConfig(
    #     name="Without TODO List",
    #     report_path="./report/report_without_todo.json",
    #     output_dir="./report/evaluation_without_todo",
    #     description="Agent operates without todo list feature"
    # ),
    # EvaluationConfig(
    #     name="With TODO List",
    #     report_path="./report/report_with_todo.json",
    #     output_dir="./report/evaluation_with_todo",
    #     description="Agent uses todo list for task management"
    # ),
]

CALIBRATION_OUTPUT_DIR = "./report/calibration_report"
RUN_CALIBRATION = True

# Evaluation date (used as context for all test cases to ensure reproducible results)
EVALUATION_CURRENT_DATE = "2025-12-10"

# Metric thresholds
ANSWER_RELEVANCY_THRESHOLD = 0.5
TASK_COMPLETION_THRESHOLD = 0.7
FAITHFULNESS_THRESHOLD = 0.7
GOAL_SATISFACTION_THRESHOLD = 0.7
FORMAT_COMPLIANCE_THRESHOLD = 0.7

# Calibration validation
CALIBRATION_POSITIVE_PASS_RATE_MIN = 0.8
CALIBRATION_NEGATIVE_FAIL_RATE_MIN = 0.8
