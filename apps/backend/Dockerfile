FROM python:3.12
WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt --no-cache-dir -r
EXPOSE 5000
CMD ["flask", "--app", "app"]
