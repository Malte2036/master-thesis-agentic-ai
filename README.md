# 🎓 Agentic ReAct AI for University Task Automation

> A modular, agentic AI system based on the ReAct (Reasoning + Acting) paradigm that enables language models to solve real-world academic tasks through orchestrated reasoning and tool use.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [✨ Features](#-features)
- [📚 Use Case](#-use-case)
- [🚀 Getting Started](#-getting-started)

## ✨ Features

### Core Components

- **Modular Agent Framework** (TypeScript)
  - `moodle-agent`: Retrieves course data, assignments, grades, etc.
  - `calendar-agent`: Creates calendar events from assignment data
  - `routing-agent`: Orchestrates ReAct-style Thought → Action → Observation loops

### Technical Highlights

- **Custom ReAct Implementation**
  - No external agent frameworks like LangChain
  - Fully typed interfaces using `zod`
  - Interpretable execution trace per task

### System Features

- **Prompt Engineered System Messages**
  - Observer summarization prompts
  - Friendly natural language response prompts
- **Task Success Evaluation Pipeline** (planned)

> ⚠️ **Note**: This project is designed for experimentation, not production deployment.

## 📚 Use Case

### Example Scenario

> "Show me all my current courses, and create calendar events for any assignments due in the next 14 days."

### Process Flow

1. Retrieves all enrolled courses via the `moodle-agent`
2. Extracts upcoming assignments
3. Filters those due within 14 days
4. Creates calendar entries via the `calendar-agent`
5. Returns a human-readable response

All steps are executed via ReAct iterations with transparent Thought/Action/Observation chains.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Start all agents (e.g. routing-agent, moodle-agent, calendar-agent)
pnpm dev
```
