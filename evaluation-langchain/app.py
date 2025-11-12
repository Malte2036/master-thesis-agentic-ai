# app.py
from langchain.tools import StructuredTool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate
import requests
import json
import os

open_api_url="http://10.50.60.153:8000/v1"
model="Qwen/Qwen3-4B"

# --- Tool definitions -------------------------------------------------------

def call_moodle_tool(tool_name: str, params: dict):
    """Call the Moodle MCP server (http://localhost:3003/mcp)."""
    resp = requests.post(
        "http://localhost:3003/mcp",
        json={"method": tool_name, "params": params, "id": 1, "jsonrpc": "2.0"},
        timeout=15,
    )
    return resp.json()

def call_calendar_tool(tool_name: str, params: dict):
    """Call the Calendar MCP server (http://localhost:3004/mcp)."""
    resp = requests.post(
        "http://localhost:3004/mcp",
        json={"method": tool_name, "params": params, "id": 1, "jsonrpc": "2.0"},
        timeout=15,
    )
    return resp.json()

moodle_tool = StructuredTool.from_function(
    func=call_moodle_tool,
    name="moodle_mcp",
    description="Call a Moodle MCP tool by name and parameters (method, params).",
)

calendar_tool = StructuredTool.from_function(
    func=call_calendar_tool,
    name="calendar_mcp",
    description="Call a Calendar MCP tool by name and parameters (method, params).",
)

# --- Model ------------------------------------------------------------------

llm = ChatOpenAI(model=model, openai_api_base=open_api_url, api_key="test", temperature=0.1)

# --- Prompt -----------------------------------------------------------------

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an assistant connected to Moodle and Calendar MCP servers."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

# --- Agent ------------------------------------------------------------------

agent = create_openai_functions_agent(llm, [moodle_tool, calendar_tool], prompt)
executor = AgentExecutor(agent=agent, tools=[moodle_tool, calendar_tool], verbose=True)

# --- Run --------------------------------------------------------------------

if __name__ == "__main__":
    query = "List all my courses and create a calendar event for tomorrow at 10am called 'Study Block'."
    result = executor.invoke({"input": query})
    print("\n=== FINAL RESULT ===")
    print(json.dumps(result, indent=2))