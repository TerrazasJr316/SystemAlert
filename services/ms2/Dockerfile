FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el .proto compartido y generamos los stubs de cliente gRPC
COPY proto/priority.proto ./proto/priority.proto
RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=. \
    --grpc_python_out=. \
    ./proto/priority.proto

COPY . .

CMD ["python", "main.py"]
