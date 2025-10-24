FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash chainlit && \
    chown -R chainlit:chainlit /app
USER chainlit

# Expose the port that Chainlit runs on
EXPOSE 8000

# Set environment variables
ENV CHAINLIT_HOST=0.0.0.0
ENV CHAINLIT_PORT=8000

# Run the Chainlit application
CMD ["chainlit", "run", "app.py", "--host", "0.0.0.0", "--port", "8000"]
