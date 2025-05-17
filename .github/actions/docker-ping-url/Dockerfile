FROM python:alpine3.20

WORKDIR /app

COPY requirements.txt .

# Install system dependencies (using apk instead of apt)
RUN apk add --no-cache \
    cairo-dev \
    pkgconfig \
    python3-dev \
    gcc \
    musl-dev

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel packaging
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "/app/main.py"]