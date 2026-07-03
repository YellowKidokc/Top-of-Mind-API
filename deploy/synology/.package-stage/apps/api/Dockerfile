FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY file_intelligence_hub ./file_intelligence_hub
COPY config ./config
COPY schemas ./schemas

RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir .

EXPOSE 10000

CMD ["fihub-api", "--host", "0.0.0.0", "--port", "10000"]
