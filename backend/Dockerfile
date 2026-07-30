FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY start.sh .
# Normalize line endings (a CRLF start.sh from a Windows checkout makes the
# kernel look for interpreter "/bin/sh\r" → "No such file or directory") and
# invoke via sh so execution never depends on the exec bit or line endings.
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

EXPOSE 8000
CMD ["sh", "start.sh"]
