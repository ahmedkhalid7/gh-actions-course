FROM python

WORKDIR /app

COPY requirements.txt .

RUN python -V
RUN apt install libcairo2-dev pkg-config python3-dev
RUN pip install --upgrade pip setuptools wheel packaging
RUN pip install --no-cache-dir -r requirements.txt 

COPY . . 

CMD ["python", "/app/main.py"]