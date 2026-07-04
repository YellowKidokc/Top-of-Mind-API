# File Intelligence Hub API
# Builds a container with the FastAPI app + uvicorn server

FROM python:3.12-slim

# Install git (for self-hosted runner compatibility) and clean up
RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy pyproject first for layer caching
COPY pyproject.toml ./
COPY schemas/ ./schemas/
COPY config/ ./config/

# Install the package and all dependencies
RUN pip install --no-cache-dir -e ".[dev]"

# Copy the rest of the application
COPY file_intelligence_hub/ ./file_intelligence_hub/
COPY tests/ ./tests/

# Create data directory for SQLite
RUN mkdir -p /app/.data

# Expose the API port
EXPOSE 10000

# Health check to verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/health || exit 1

# Start the API server
CMD ["fihub-api", "--host", "0.0.0.0", "--port", "10000"]
