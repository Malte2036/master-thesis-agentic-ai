import chainlit as cl
from chainlit.input_widget import Select
import httpx
import json
import asyncio
from typing import Optional, Dict, Any, List

# Configuration
ROUTING_AGENT_URL = "http://localhost:3000"

async def get_available_models() -> List[str]:
    """Fetch available models from the routing agent."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ROUTING_AGENT_URL}/models")
            response.raise_for_status()
            models_data = response.json()
            # Extract model names from the response
            if isinstance(models_data, list):
                return [model.get('name', model) if isinstance(model, dict) else str(model) for model in models_data]
            return ["mixtral:8x7b"]  # fallback
        except Exception as e:
            print(f"Error fetching models: {e}")
            return ["mixtral:8x7b", "llama3.1:8b", "qwen3:4b"]  # fallback models

async def ask_routing_agent(
    question: str,
    router: str = "react",
    max_iterations: int = 5,
    model: str = "mixtral:8x7b"
) -> Optional[str]:
    """Send a question to the routing agent and get a response."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ROUTING_AGENT_URL}/ask",
                json={
                    "prompt": question,
                    "router": router,
                    "max_iterations": max_iterations,
                    "model": model
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error calling routing agent: {e}")
            return None

@cl.step
async def show_processing_step(question: str):
    """Show the processing step."""
    current_step = cl.context.current_step
    current_step.input = question
    current_step.output = "The system is processing your question..."

async def show_iteration_update( iteration_id: int, natural_language_thought: str, structured_thought: str, observation: str):
    """Show the iteration update."""
    async with cl.Step(
        name=f"Iteration {iteration_id}",
        type="",
        elements=[cl.Text(content=natural_language_thought), cl.Text(content=json.dumps(structured_thought, indent=2)), cl.Text(content=observation)]
    ) as step:
        await step.update()

async def stream_updates(session_id: str, agentic_viewer_element: cl.CustomElement):
    """Stream updates from the routing agent using SSE and update the AgenticProcessViewer component."""
    print(f"Starting SSE stream for session {session_id}")
    final_answer_received = False
    iterations = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            async with client.stream('GET', f"{ROUTING_AGENT_URL}/stream/{session_id}") as response:
                response.raise_for_status()
                print("SSE connection established")
                
                async for line in response.aiter_lines():
                    print(f"Received SSE line: {line}")
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])  # Remove 'data: ' prefix
                            print(f"Parsed SSE data: {data}")
                            update_type = data.get('type')
                            update_data = data.get('data')

                            if update_type == 'iteration_update':
                                # Add new iteration to the list
                                iteration = {
                                    'iteration': update_data.get('iteration'),
                                    'naturalLanguageThought': update_data.get('naturalLanguageThought'),
                                    'structuredThought': update_data.get('structuredThought'),
                                    'observation': update_data.get('observation')
                                }
                                iterations.append(iteration)
                                
                                # Update the AgenticProcessViewer component
                                agentic_viewer_element.props['iterations'] = iterations
                                agentic_viewer_element.props['status'] = 'processing'
                                await agentic_viewer_element.update()
                            
                            elif update_type == 'final_response':
                                # Update with final response
                                final_response = update_data.get('friendlyResponse', 'Processing complete.')
                                agentic_viewer_element.props['iterations'] = iterations
                                agentic_viewer_element.props['finalResponse'] = final_response
                                agentic_viewer_element.props['status'] = 'completed'
                                await agentic_viewer_element.update()
                                final_answer_received = True
                                print("Final answer received and component updated")

                                await cl.Message(
                                    content=final_response,
                                    author="Assistant"
                                ).send()
                            
                            elif update_type == 'error':
                                if final_answer_received:
                                    return
                                
                                # Update with error
                                agentic_viewer_element.props['iterations'] = iterations
                                agentic_viewer_element.props['error'] = update_data
                                agentic_viewer_element.props['status'] = 'error'
                                await agentic_viewer_element.update()
                                break

                        except json.JSONDecodeError as e:
                            print(f"Error decoding SSE data: {line}")
                            print(f"JSON decode error: {e}")
                            continue

        except Exception as e:
            print(f"Error in SSE stream: {e}")
            # Only show connection error if we haven't received the final answer yet
            if not final_answer_received:
                agentic_viewer_element.props['iterations'] = iterations
                agentic_viewer_element.props['error'] = 'Lost connection to the server.'
                agentic_viewer_element.props['status'] = 'error'
                await agentic_viewer_element.update()


async def show_agentic_process(main_step: cl.Step):
    """Show the agentic process."""
    async with cl.Step(name="Agentic Process", type="run") as step:
        step.input = "Processing your question..."
        step.output = "Processing your question...Starting to think..."
        await step.update()


@cl.on_chat_start
async def start():
    """Initialize the chat session."""

    selected_model = cl.user_session.get("chat_settings", {}).get("Model", "qwen3:4b")
    
    # Fetch available models
    available_models = await get_available_models()
    if selected_model not in available_models:
        print(f"Selected model {selected_model} not in available models {available_models}")
        selected_model = available_models[0]
        cl.user_session.set("chat_settings", {"Model": selected_model})

    print(f"Selected model: {selected_model}")
    print(f"Available models: {available_models}")
    
    # Create chat settings for model selection
    await cl.ChatSettings(
        [
            Select(
                id="Model",
                label="AI Model",
                values=available_models,
                initial_index= available_models.index(selected_model) if selected_model in available_models else 0
            ),
        ]
    ).send()
    
    

@cl.set_starters
async def set_starters():
     return [
        cl.Starter(
            label="Get my user information",
            message="Can you help me get my user information?",
            # icon="/public/idea.svg",
            ),
            cl.Starter(
                label="Get all my modules",
                message="Can you get me all my modules?",
                # icon="/public/idea.svg",
            ),
            cl.Starter(
                label="Get Information about a specific module",
                message="Can you get me information about the module 'Digital Health'?",
                # icon="/public/idea.svg",
            ),
        ]

@cl.on_settings_update
async def on_settings_update(settings):
    """Handle settings updates."""
    selected_model = settings.get("Model", "mixtral:8x7b")
    print(f"Model updated to: {selected_model}")
    
    # Store settings in user session
    cl.user_session.set("chat_settings", settings)
    
    await cl.Message(
        content=f"✅ AI model updated to: **{selected_model}**",
        author="Assistant"
    ).send()

async def run_demo(agentic_viewer: cl.CustomElement):
    """Run a demo of the agentic process with sample data."""
    
    # Demo iteration 1
    await asyncio.sleep(1)
    demo_iteration_1 = {
        'iteration': 1,
        'naturalLanguageThought': 'I need to understand what the user is asking about. They want to know about course registration deadlines. Let me search for relevant information in the academic calendar.',
        'structuredThought': {
            'action': 'search_academic_calendar',
            'parameters': {
                'query': 'course registration deadlines',
                'semester': 'current'
            },
            'reasoning': 'Need to find current registration deadlines for courses'
        },
        'observation': 'Found academic calendar information. Registration deadlines vary by course type: undergraduate courses have deadline March 15th, graduate courses have deadline March 22nd.'
    }
    
    agentic_viewer.props['iterations'] = [demo_iteration_1]
    agentic_viewer.props['status'] = 'processing'
    await agentic_viewer.update()
    
    # Demo iteration 2
    await asyncio.sleep(2)
    demo_iteration_2 = {
        'iteration': 2,
        'naturalLanguageThought': 'Now I have the registration deadlines, but I should also check if there are any late registration options or special circumstances that might apply.',
        'structuredThought': {
            'action': 'search_policies',
            'parameters': {
                'query': 'late registration policy exceptions',
                'category': 'academic_policies'
            },
            'reasoning': 'Students might need information about late registration options'
        },
        'observation': 'Found late registration policy: Students can register up to 1 week after deadline with academic advisor approval and late fee of $50.'
    }
    
    agentic_viewer.props['iterations'] = [demo_iteration_1, demo_iteration_2]
    agentic_viewer.props['status'] = 'processing'
    await agentic_viewer.update()
    
    # Demo iteration 3
    await asyncio.sleep(2)
    demo_iteration_3 = {
        'iteration': 3,
        'naturalLanguageThought': 'I should also check the current date to see if we are before or after the deadline, so I can give contextual advice.',
        'structuredThought': {
            'action': 'get_current_date',
            'parameters': {},
            'reasoning': 'Need to know current date to provide relevant timeline information'
        },
        'observation': 'Current date is March 10th, 2024. This means registration deadlines are still upcoming for both undergraduate (5 days) and graduate courses (12 days).'
    }
    
    agentic_viewer.props['iterations'] = [demo_iteration_1, demo_iteration_2, demo_iteration_3]
    agentic_viewer.props['status'] = 'processing'
    await agentic_viewer.update()
    
    # Final response
    await asyncio.sleep(1.5)
    final_response = """
## Course Registration Deadlines 📅

Good news! You still have time to register for courses:

### **Upcoming Deadlines:**
- **Undergraduate courses**: March 15th, 2024 (5 days remaining)
- **Graduate courses**: March 22nd, 2024 (12 days remaining)

### **Late Registration Option:**
If you miss the deadline, you can still register up to 1 week later with:
- Academic advisor approval required
- Late registration fee: $50

### **What to do now:**
1. Review available courses in the course catalog
2. Meet with your academic advisor if needed
3. Complete registration before the deadline to avoid fees

*Current date: March 10th, 2024*
    """
    
    agentic_viewer.props['iterations'] = [demo_iteration_1, demo_iteration_2, demo_iteration_3]
    agentic_viewer.props['finalResponse'] = final_response.strip()
    agentic_viewer.props['status'] = 'completed'
    await agentic_viewer.update()

@cl.on_message
async def main(message: cl.Message):
    """Handle incoming messages."""
    print(f"Received message: {message.content}")
    
    # Get the selected model from chat settings
    chat_settings = cl.user_session.get("chat_settings", {})
    selected_model = chat_settings.get("Model", "mixtral:8x7b")
    print(f"Using model: {selected_model}")
    
    # Check if user wants a demo
    if message.content.lower().strip() == "demo":
        # Create the AgenticProcessViewer component for demo
        agentic_viewer = cl.CustomElement(
            name="AgenticProcessViewer",
            props={
                "iterations": [],
                "status": "processing",
                "error": None,
                "finalResponse": None
            }
        )
        
        # Send the component to the UI
        await cl.Message(
            content=f"🎬 **Demo Mode**: Simulating AI agent processing for course registration question using **{selected_model}**...",
            elements=[agentic_viewer]
        ).send()
        
        # Run the demo
        await run_demo(agentic_viewer)
        return
    
    # Create the AgenticProcessViewer component
    agentic_viewer = cl.CustomElement(
        name="AgenticProcessViewer",
        props={
            "iterations": [],
            "status": "processing",
            "error": None,
            "finalResponse": None
        }
    )
    
    # Send the component to the UI
    await cl.Message(
        content=f"Processing your question with AI agents using **{selected_model}**...",
        elements=[agentic_viewer]
    ).send()
    
    # Call the routing agent with the selected model
    response = await ask_routing_agent(message.content, model=selected_model)
    print(f"Routing agent response: {response}")
    
    if response and "id" in response:
        # Start streaming updates (this will update the AgenticProcessViewer component)
        await stream_updates(response["id"], agentic_viewer)
    else:
        # Update component with error
        agentic_viewer.props['error'] = 'Failed to process your question. Please try again.'
        agentic_viewer.props['status'] = 'error'
        await agentic_viewer.update()
        

