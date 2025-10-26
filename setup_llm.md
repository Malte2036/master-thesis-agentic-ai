# LLM Setup Guide

This guide explains how to set up a local LLM server using vLLM for the master thesis agentic AI project.

## Prerequisites

- Python 3.8 or higher
- CUDA-compatible GPU (recommended for optimal performance)
- Sufficient GPU memory (at least 8GB VRAM recommended for Qwen3-4B)

## Setup Instructions

### 1. Create Virtual Environment

Create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. Install vLLM

Install vLLM and its dependencies:

```bash
pip install vllm
```

### 3. Start the LLM Server

Run the vLLM server with the Qwen3-4B model:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-4B \
  --gpu-memory-utilization 0.9 \
  --max-model-len 8192
```

### Configuration Parameters

- `--model Qwen/Qwen3-4B`: Specifies the model to use (Qwen3-4B from Hugging Face)
- `--gpu-memory-utilization 0.9`: Uses 90% of available GPU memory
- `--max-model-len 8192`: Sets maximum context length to 8192 tokens

### 4. Verify Installation

Once the server is running, you should see output similar to:

```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

The server will be available at `http://localhost:8000` and provides an OpenAI-compatible API.

## Usage

### API Endpoint

The server exposes an OpenAI-compatible API at:

- Base URL: `http://localhost:8000`
- Chat completions: `POST /v1/chat/completions`

### Example Usage

You can test the server using curl:

```bash
curl -X POST "http://localhost:8000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-4B",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 100
  }'
```

## Troubleshooting

### Common Issues

1. **CUDA Out of Memory**: Reduce `--gpu-memory-utilization` to 0.7 or 0.8
2. **Model Download Issues**: Ensure you have sufficient disk space and internet connection
3. **Port Already in Use**: Use `--port` parameter to specify a different port

### Performance Optimization

- Increase `--gpu-memory-utilization` if you have more VRAM available
- Adjust `--max-model-len` based on your use case requirements
- Use `--tensor-parallel-size` for multi-GPU setups

## Integration with Project

This LLM server can be integrated with the agentic AI system by configuring the appropriate environment variables or API endpoints in the project configuration files.

## Additional Resources

- [vLLM Documentation](https://docs.vllm.ai/)
- [Qwen Model Information](https://huggingface.co/Qwen/Qwen3-4B)
- [OpenAI API Compatibility](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html)
