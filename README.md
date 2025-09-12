# 🎓 Agentic ReAct AI for University Task Automation

> A modular, agentic AI system based on the ReAct (Reasoning + Acting) paradigm that enables language models to solve real-world academic tasks through orchestrated reasoning and tool use.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [📝 Project Details](#-project-details)
  - [High-Level Thesis Goal](#high-level-thesis-goal)
  - [Overall Architecture](#overall-architecture)
  - [System Components](#system-components)
  - [Current State & Key Characteristics](#current-state--key-characteristics)
- [📚 Use Case](#-use-case)
- [🚀 Getting Started](#-getting-started)

## 📝 Project Details

### High-Level Thesis Goal

This project is a master's thesis that implements a modular, multi-agent AI system from scratch to automate university-related tasks. It is built on the **ReAct (Reasoning + Acting)** paradigm, where a central AI orchestrator can reason about a problem, select tools, observe the results, and repeat the cycle until the user's request is fulfilled. A key focus is on the interpretability of the agent's process, making the AI's "thinking" transparent to the user.

### Overall Architecture

The system is designed with a hierarchical, **microservices-based multi-agent architecture**. This architecture features a clear separation of concerns between a single, autonomous agent that can reason and make decisions, and a set of passive "tool agents" that provide specialized capabilities.

This is a powerful and common pattern: the autonomous agent acts as an **artisan**, and the tool agents are its specialized **tools**. The artisan decides which tool to use and for what purpose; the tools simply execute their function when called upon.

Communication between the central orchestrator and the tool agents is handled by the **Model Context Protocol (MCP)**, a standardized protocol that allows the orchestrator to dynamically discover and execute the functions (tools) that each agent provides.

### System Components

The project is a polyglot monorepo (TypeScript/Node.js and Python) containing the following main components:

- **User Interface (`apps/chainlit`):**

  - **Technology:** Python with the Chainlit framework.
  - **Function:** Provides a web-based chat interface for the user. It communicates with the backend via HTTP and Server-Sent Events (SSE) for real-time updates.
  - **Key Feature:** It includes a custom React component (`AgenticProcessViewer`) that visualizes the agent's step-by-step reasoning process (Thought -> Action -> Observation) as it happens.

- **Autonomous Orchestrator Agent (`apps/routing-agent`):**

  - **Technology:** TypeScript/Node.js.
  - **Function:** This is the "brain" or **artisan** of the system. As a true autonomous agent, it perceives the user's request, reasons about it, and acts to fulfill the goal. It manages the entire ReAct loop.
  - **Implementation:** It uses a custom-built `ReActRouter` that:
    1.  **Reasons (Thought):** Generates a natural language thought about what to do next.
    2.  **Plans (Structured Thought):** Translates the thought into a structured, machine-readable plan that specifies which tool agent to call, which function to use, and with what arguments.
    3.  **Acts (Tool Use):** Dispatches the function calls to the appropriate tool agents via MCP.

- **Specialized Tool Agents (`apps/moodle-mcp`, `apps/calendar-mcp`):**

  - **Technology:** TypeScript/Node.js standalone services.
  - **Function:** These are the passive "workers" or **tools** that the orchestrator wields. They do not have their own reasoning loops or goals. They simply wait for commands from the orchestrator and execute their specific function (e.g., connect to an external API).
  - **`moodle-mcp`:** Provides tools for interacting with the Moodle Learning Management System.
    - `get_all_courses`, `search_courses_by_name`, `get_course_contents`, `get_all_assignments_for_all_courses`, `get_assignments_for_course`, `get_user_info`.
  - **`calendar-mcp`:** Provides a single, focused tool for calendar operations.
    - `create_calendar_event`.

- **Shared Libraries (`packages/`):**
  - **`agent-framework`:** A shared TypeScript package that provides the core infrastructure for creating new agents and enabling them to communicate via the **Model Context Protocol (MCP)**.
  - **`types`:** A centralized package defining shared TypeScript types and Zod schemas, ensuring data consistency across all services.

### Current State & Key Characteristics

- **Framework-Free Core Logic:** The ReAct orchestration loop is implemented from the ground up, demonstrating a deep understanding of agentic principles without relying on third-party libraries like LangChain.
- **Runnable System:** The project is a fully functional, multi-component system that can be run via `pnpm` and `docker-compose`.
- **Focus on Transparency:** The real-time visualization of the agent's thought process is the most prominent feature of the user experience.
- **Identified Area for Improvement:** The "Observation" step in the `routing-agent` is at a foundational stage. Currently, the agent observes the raw JSON output from the tool calls. The code block intended to create a natural language summary of this response is commented out.

> ⚠️ **Note**: This project is designed for experimentation, not production deployment.

## 📚 Use Case

### Example Scenario

> "Show me all my current courses, and create calendar events for any assignments due in the next 14 days."

### Process Flow

The system operates on the ReAct (Reason-Act) principle. For the example scenario, the flow is orchestrated by the `routing-agent` over several iterations:

1.  **Initial Prompt:** The user asks: _"Show me all my current courses, and create calendar events for any assignments due in the next 14 days."_

2.  **Iteration 1: Getting Course Information**

    - **🤔 Thought:** The `routing-agent` decides it first needs to know which courses the user is enrolled in to find their assignments.
    - **🎬 Action:** It calls the `get_all_courses` function on the `moodle-mcp`.
    - **👀 Observation:** It receives a JSON list of the user's courses from the `moodle-mcp`.

3.  **Iteration 2: Finding Assignments**

    - **🤔 Thought:** Now that it has the courses, the agent decides it needs to find the assignments for those courses.
    - **🎬 Action:** It calls the `get_assignments_for_course` function on the `moodle-mcp` for each course ID it found.
    - **👀 Observation:** It receives a JSON list of assignments, including their due dates.

4.  **Iteration 3: Creating Calendar Events**

    - **🤔 Thought:** The agent now has the assignments. It filters them to find those due in the next 14 days and decides it needs to create calendar events for them.
    - **🎬 Action:** For each relevant assignment, it calls the `create_calendar_event` function on the `calendar-mcp`, passing the assignment's name and due date.
    - **👀 Observation:** It receives a success confirmation from the `calendar-mcp` for each created event.

5.  **Final Response:**
    - **🤔 Thought:** The agent sees that all tasks are complete. It decides it's time to formulate a friendly response to the user.
    - **🎬 Action:** The agent generates a final, human-readable summary of the actions it took.
    - **✅ Output:** The user receives a message like: "I have found your courses and created calendar events for 3 upcoming assignments."

This entire process is streamed to the user interface, providing a transparent view of the agent's reasoning at every step.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Start all agents (e.g. routing-agent, moodle-mcp, calendar-mcp)
pnpm dev
```
