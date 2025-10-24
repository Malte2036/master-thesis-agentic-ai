# Chainlit App

A Chainlit-based application for agentic AI interactions.

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Setup

1. **Navigate to the chainlit directory:**

   ```bash
   cd apps/chainlit
   ```

2. **Create and activate a virtual environment:**

   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   # venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Chainlit app:**

   ```bash
   chainlit run app.py
   ```

2. **Access the application:**
   - Open your browser and navigate to `http://localhost:8000`
   - The Chainlit interface will be available for interaction

### Development

- The main application code is in `app.py`
- Custom UI elements are in the `public/elements/` directory
- Configuration files are in the `.chainlit/` directory

### Dependencies

- `chainlit>=2.8.3` - Main Chainlit framework
- `httpx>=0.28.1` - HTTP client library

For a complete list of dependencies, see `requirements.txt`.
