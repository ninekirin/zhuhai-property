FROM python:3.9-slim

RUN apt-get update -y && apt-get upgrade -y

RUN apt-get install -y tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir --trusted-host pypi.python.org -r /app/requirements.txt

CMD ["python", "-u", "run.py"]