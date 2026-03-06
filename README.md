# 🦸‍♂️ Superhero Dispatch Network (SDN) 🚨

**Welcome, Agent!**  
Congratulations on becoming the newest member of the Superhero Dispatch Network (SDN) – where saving the world is just another day at the office. 😎

Our mission?  
Dispatch superheroes with lightning speed to where they’re needed most.  
Your toolkit? A cutting-edge, multi-container application – just waiting for you to deploy!

---

## 🏁 Quickstart: Activate Your SDN Console

**Step 1: Clone the SDN Super Project Repository**
```bash
git clone <this-repo-url>
cd <repo-directory>
```

**Step 2: Start Colima**
```bash
colima start
```

**Step 3: Assemble the SDN with Docker Compose**
```bash
docker compose up --build
```
*subsequent commands on the same machine can remove build tag*

**Step 4: Clock in and Dispatch! ⏰**\
Access to Dispatch Network http://localhost:6160

## 💻 How Does It All Work?

When SDN is running, agents (users) enter their name on the homepage.
If registered, our intelligence systems instantly greet their superhero identity (e.g., “Mecha Man 🦾”).
Seamless communication between a Spring Boot backend and a Node.js/Express frontend powers your SDN Command Center, all within isolated Docker containers.

## 🔭 Observability Stack (Logs + Metrics + Traces)

This project now includes a full observability pipeline for the Spring Boot backend:

- **Metrics:** Spring Actuator + Prometheus
- **Traces:** Micrometer Tracing (OpenTelemetry) → OTel Collector → Jaeger
- **Logs:** Structured JSON logs from Spring Boot → Promtail → Loki (query in Grafana)

### 1) Metrics flow

1. Backend exposes metrics at `http://backend:9001/actuator/prometheus` (prod profile).
2. Prometheus scrapes that endpoint using `observability/prometheus.yml`.
3. Grafana reads metrics from Prometheus datasource.

### 2) Trace flow

1. Spring Boot creates spans for incoming requests and downstream calls (sampling set to `1.0`).
2. Backend exports traces over OTLP HTTP to `otel-collector:4318/v1/traces`.
3. OTel Collector receives traces and exports them to Jaeger.
4. Jaeger UI lets you inspect full request traces.

### 3) Log flow + correlation

1. Backend logs are emitted as **structured JSON** (`logging.structured.format.console=logstash`).
2. App logs include business fields (e.g., `dispatchId`, `heroCode`, `severity`) via structured key-value logging.
3. Micrometer tracing injects `traceId`/`spanId` into log context, so logs correlate with traces.
4. Promtail discovers Docker containers and ships logs to Loki.
5. Grafana queries Loki logs; datasource derived field can jump from log `traceId` to Jaeger trace.

## 🧭 Observability Endpoints

- App UI: http://localhost:6160
- Backend API: http://localhost:8080
- Backend actuator/prometheus: http://localhost:9001/actuator/prometheus
- Prometheus UI: http://localhost:9090
- Jaeger UI: http://localhost:16686
- Grafana UI: http://localhost:3000 (admin/admin)
- Loki API: http://localhost:3100

## ▶️ Run with observability

```bash
docker compose up --build
```

To generate telemetry, hit the dispatch endpoint a few times:

```bash
curl -X POST http://localhost:8080/dispatches \
  -H "Content-Type: application/json" \
  -d '{"heroCode":"SHELLHEAD","severity":1}'
```
> Alternative heroCodes: `AMAZON`, `BLUE-BLUR`, `DARK-KNIGHT`, `WEB-HEAD`, `LAST-SON`, `MECHA-BLUE`, etc.

Then:
- Check **Prometheus** for `dispatches_created_total`
- Check **Jaeger** for `/dispatches` traces
- Check **Grafana → Loki** for JSON logs containing `dispatchId` and `traceId`

## 💬 Useful SDN Commands

| ACTION                     | COMMAND                           |
|----------------------------|-----------------------------------|
| Start Colima               | ```colima start```                |
| Build & Run SDN Containers | ```docker compose up --build```   |
| Stop All SDN Activities    | ```docker compose down```         |
| View backend logs          | ```docker-compose logs backend``` |
| View backend logs          | ```docker-compose logs backend``` |

# 🫡 Ready? Happy Dispatching! 🧑‍💻