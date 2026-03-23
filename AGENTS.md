# Repository Guidelines

## Project Structure & Module Organization
This repository is split into three main areas:

- `backend/`: Spring Boot 3.4 service built with Gradle and Java 17. Application code lives under `backend/src/main/java/com/superhero/multicontainerdemo`, with feature packages such as `hero/`, `dispatch/`, and `config/`. Backend tests live in `backend/src/test/java`.
- `frontend/`: Node.js + Express UI. Server code is in `frontend/app/`, static assets in `frontend/assets/`, and route-level tests in `frontend/test/`.
- `observability/`: Prometheus, Loki, Promtail, Jaeger, Grafana, and OpenTelemetry Collector configuration used by `docker-compose.yml`.

## Build, Test, and Development Commands
- `docker compose up --build`: build and start the full stack locally, including PostgreSQL and observability services.
- `docker compose down`: stop the stack and remove running containers.
- `./gradle-test.sh`: run the full test suite. This starts a disposable PostgreSQL container, runs `npm ci && npm test` in `frontend/`, then `./gradlew test` in `backend/`.
- `cd backend && ./gradlew test`: run backend tests only.
- `cd frontend && npm test`: run frontend tests only with Node’s built-in test runner.

## Coding Style & Naming Conventions
Follow the style already in the codebase:

- JavaScript uses CommonJS, 4-space indentation, `const` by default, camelCase for functions/variables, and small modules under `frontend/app/services`, `utils`, and `views`.
- Java uses standard Spring conventions, 4-space indentation, PascalCase for classes/records, and package-by-feature structure.
- Keep endpoint, DTO, and service names explicit, for example `CreateDispatchRequest` and `HeroLookupResponse`.
- No formatter or linter config is committed here, so match existing formatting exactly and keep diffs narrow.

## Testing Guidelines
- Frontend tests use `node:test` with files named `*.test.js` under `frontend/test/`.
- Backend tests use JUnit 5 and Spring Boot test support, with integration-style coverage in `backend/src/test/java`.
- Add or update tests with every behavior change, especially for routing, validation, persistence, and dispatch flows.

## Commit & Pull Request Guidelines
- Recent commits use short, imperative messages such as `add testing modules` or `fix CRUD bug`, often with a trailing emoji. Keep the subject concise and scoped to one change.
- Pull requests should include a clear summary, note impacted services (`backend`, `frontend`, `observability`), link any issue, and include screenshots for UI changes.

## Configuration Tips
- Default local ports are `6160` (frontend), `8080` and `9001` (backend), `5432` (PostgreSQL), `3000` (Grafana), and `16686` (Jaeger).
- Test and local DB credentials are intentionally simple (`superhero` / `superhero`); avoid reusing them outside local development.
