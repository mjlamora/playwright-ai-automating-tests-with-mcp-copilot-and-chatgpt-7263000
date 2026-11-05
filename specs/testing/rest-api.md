# BuggyBoard REST API Test Plan

## Scope and Endpoint Inventory

This plan is based on the Express routes and service validation in `backend/src/index.ts`, `backend/src/bugService.ts`, `backend/src/authService.ts`, and `backend/src/db.ts`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API and database health |
| POST | `/api/login` | Validate configured user credentials |
| GET | `/api/bugs` | List bugs |
| GET | `/api/bugs/:id` | Read one bug |
| POST | `/api/bugs` | Create a bug |
| PUT | `/api/bugs/:id` | Replace all editable fields of a bug |
| DELETE | `/api/bugs/:id` | Delete a bug |

## Test Setup and Conventions

- Send requests directly to the backend (port `3000`) with Playwright's `APIRequestContext`; these tests cover the REST API, not browser UI flows.
- Start the backend with the repository's normal test environment. Use unique fixture titles and record IDs from successful create responses.
- Clean up only bugs created by the test. Do not delete or mutate pre-existing database records.
- Keep each validation case independent. For a required-field test, make all other fields valid so the response exercises the intended validation.
- Use `Content-Type: application/json` for JSON request bodies.
- Verify status codes, response JSON shape and values, and persistence through subsequent GET requests where appropriate.
- Bug responses contain `id`, `title`, `severity`, `owner`, `description`, and `state`. Severity values are uppercase `HIGH`, `MID`, or `LOW`; state values are uppercase `OPEN` or `CLOSED`.
- Login reads accounts from the root `users.json`; tests should use a configured account and avoid logging passwords.

## API-wide Behavior

- API paths use the `/api` prefix.
- Routes currently have no authentication middleware. Do not expect unauthenticated API requests to be rejected; record this as the current behavior, not an authorization guarantee.
- Unsupported methods or unknown paths should be checked for a not-found response where useful. Express currently supplies the default 404 response.
- Malformed JSON should be checked for an HTTP 400 response from the JSON body parser.
- ID handling deserves boundary coverage: the routes call `parseInt`, which may accept numeric prefixes such as `12abc` or decimals such as `12.5` as ID `12`. Tests for non-integer IDs should expect a clear 400 under the positive-integer ID contract and will expose this current parsing weakness.

## Endpoint Scenarios

### 1. Health — `GET /api/health`

#### 1.1. Reports a healthy API and database

**Positive**

- **Arrange:** Start the backend with its database initialized and reachable.
- **Act:** Request `GET /api/health`.
- **Assert:** Response is `200`; JSON has `ok: true`, message `BuggyBoard API is running`, and `database: "connected"`.

#### 1.2. Reports database failure state

**Negative / degraded dependency**

- **Arrange:** Run the health handler with database access unavailable using a controlled test database or isolated fault-injection setup.
- **Act:** Request `GET /api/health`.
- **Assert:** The handler reports `database: "error"` rather than claiming the database is connected. Current implementation still returns `200` and `ok: true`; capture this response contract explicitly.

#### 1.3. Rejects an unsupported method

**Negative**

- **Arrange:** Ensure the API is running.
- **Act:** Send `POST /api/health`.
- **Assert:** Response is `404`; the health handler is not invoked as a POST route.

### 2. Login — `POST /api/login`

#### 2.1. Accepts valid credentials

**Positive**

- **Arrange:** Read a valid account from `users.json`.
- **Act:** Submit its username and password.
- **Assert:** Response is `200` with JSON `{ "username": "<trimmed username>" }`.

#### 2.2. Trims surrounding username whitespace

**Positive**

- **Arrange:** Read a valid account from `users.json`.
- **Act:** Submit its username with leading/trailing whitespace and its exact password.
- **Assert:** Response is `200` and the response username is trimmed.

#### 2.3. Rejects invalid username or password

**Negative**

- **Arrange:** Use a non-empty username/password pair.
- **Act:** In separate requests, submit an unknown username and a valid username with an incorrect password.
- **Assert:** Both return `401` with `error: "invalid_credentials"` and the same generic message; no password is returned.

#### 2.4. Rejects blank username

**Negative**

- **Arrange:** Use a non-empty password.
- **Act:** Submit an empty or whitespace-only username.
- **Assert:** Response is `400` with `error: "blank_username"`.

#### 2.5. Rejects blank password

**Negative**

- **Arrange:** Use a valid configured username.
- **Act:** Submit an empty password.
- **Assert:** Response is `400` with `error: "blank_password"`.

#### 2.6. Rejects both credentials blank

**Negative**

- **Arrange:** Prepare an empty username and password.
- **Act:** Submit both fields empty.
- **Assert:** Response is `400` with `error: "missing_credentials"`.

#### 2.7. Handles missing or incorrectly typed credentials

**Negative / robustness**

- **Arrange:** Prepare an absent body, missing fields, and non-string username/password values.
- **Act:** Submit each request.
- **Assert:** Missing fields produce the documented blank/missing-credential 400 responses. Incorrectly typed values should return a controlled 400 validation response rather than an unhandled server error.

The route currently casts `username` to a string without runtime validation, and the login service calls `.trim()` on it. A non-string username may currently produce a server error; this case is intended to expose that input-validation gap.

### 3. List bugs — `GET /api/bugs`

#### 3.1. Returns all bugs

**Positive**

- **Arrange:** Create multiple unique bugs, including different severities and states.
- **Act:** Request `GET /api/bugs`.
- **Assert:** Response is `200` with a JSON array containing each fixture exactly once and all six bug fields with normalized uppercase severity/state. Existing unrelated records may also be present.

#### 3.2. Returns an empty array when no bugs exist

**Positive boundary**

- **Arrange:** Use an isolated empty test database.
- **Act:** Request `GET /api/bugs`.
- **Assert:** Response is `200` with `[]`.

#### 3.3. Handles database read failure

**Negative / robustness**

- **Arrange:** Make the database unavailable in an isolated fault-injection setup.
- **Act:** Request `GET /api/bugs`.
- **Assert:** The server returns a controlled server-error response; it must not return success-shaped data such as an empty array for a failed read.

### 4. Read one bug — `GET /api/bugs/:id`

#### 4.1. Returns a bug by ID

**Positive**

- **Arrange:** Create a bug and retain its returned ID.
- **Act:** Request `GET /api/bugs/:id`.
- **Assert:** Response is `200` and contains the created bug's ID, title, normalized severity, owner, description, and state.

#### 4.2. Rejects a non-numeric ID

**Negative**

- **Arrange:** Use a clearly non-numeric path segment such as `abc`.
- **Act:** Request `GET /api/bugs/abc`.
- **Assert:** Response is `400` with `error: "invalid_id"`.

#### 4.3. Returns not found for an unknown numeric ID

**Negative**

- **Arrange:** Choose a numeric ID that does not exist in the isolated test database.
- **Act:** Request `GET /api/bugs/:id`.
- **Assert:** Response is `404` with `error: "not_found"`.

#### 4.4. Rejects non-integer and numeric-prefix IDs

**Negative / robustness**

- **Arrange:** Use values such as `12.5` and `12abc`.
- **Act:** Request the corresponding paths.
- **Assert:** Each is rejected with `400 invalid_id`; a malformed ID must not resolve to a different bug.

The current `parseInt` implementation can interpret these examples as ID `12`; this case documents the desired safe path parsing and may fail until parsing is tightened.

### 5. Create bug — `POST /api/bugs`

#### 5.1. Creates a bug with each supported severity

**Positive**

- **Arrange:** Prepare valid title, owner, and description values.
- **Act:** Submit one request for each accepted severity spelling: lowercase and uppercase `high`, `mid`, and `low`.
- **Assert:** Each response is `201`; it returns a unique numeric ID, trimmed text values, uppercase severity, and state `OPEN`. A subsequent GET by ID returns the same saved resource.

#### 5.2. Trims text fields

**Positive**

- **Arrange:** Prepare valid values with surrounding whitespace.
- **Act:** Create the bug.
- **Assert:** Response and persisted values have surrounding whitespace removed.

#### 5.3. Rejects each blank required field

**Negative**

- **Arrange:** Prepare a complete valid payload.
- **Act:** In separate requests, set only `title`, `severity`, `owner`, or `description` to an empty or whitespace-only value.
- **Assert:** Each response is `400` with its corresponding error (`blank_title`, `blank_severity`, `blank_owner`, or `blank_description`); no bug is created.

#### 5.4. Rejects an unsupported severity

**Negative**

- **Arrange:** Prepare all other fields valid.
- **Act:** Submit severity values outside `HIGH`, `MID`, and `LOW` (for example `critical`).
- **Assert:** Response is `400` with `error: "blank_severity"` and no bug is persisted.

#### 5.5. Rejects missing or incorrectly typed fields

**Negative**

- **Arrange:** Prepare requests with a missing field, a missing body, or a non-string value in each required field.
- **Act:** Submit the requests.
- **Assert:** Each is rejected with `400` and the corresponding required-field error; no record is created.

#### 5.6. Rejects malformed JSON

**Negative**

- **Arrange:** Prepare a request with `Content-Type: application/json` and invalid JSON text.
- **Act:** Submit it to `/api/bugs`.
- **Assert:** Response is `400` and no bug is created.

### 6. Update bug — `PUT /api/bugs/:id`

#### 6.1. Replaces all editable values

**Positive**

- **Arrange:** Create a fixture bug and retain its ID.
- **Act:** Submit a complete replacement payload with updated title, owner, description, severity, and state.
- **Assert:** Response is `200`; the returned resource keeps the same ID and contains trimmed values, uppercase severity/state; a subsequent GET returns those values.

#### 6.2. Accepts case-insensitive severity and state values

**Positive**

- **Arrange:** Create a fixture bug.
- **Act:** Update with supported lower-, mixed-, and uppercase severity/state values (for example `low` and `closed`).
- **Assert:** Response and subsequent GET contain normalized uppercase values.

#### 6.3. Rejects invalid path IDs

**Negative**

- **Arrange:** Prepare non-numeric, non-integer, and numeric-prefix IDs.
- **Act:** Send a PUT request for each ID.
- **Assert:** Invalid IDs return `400 invalid_id` and do not update any bug.

The current `parseInt` route handling can map decimal and numeric-prefix paths to another integer ID; those cases should expose that defect.

#### 6.4. Returns not found for a missing bug

**Negative**

- **Arrange:** Use a valid positive integer ID that does not exist and a complete valid payload.
- **Act:** Send the PUT request.
- **Assert:** Response is `404 not_found`.

#### 6.5. Rejects each blank required field without mutation

**Negative**

- **Arrange:** Create a fixture bug and save its current values.
- **Act:** In separate requests, submit a complete replacement payload with only one of title, severity, owner, or description blank/whitespace.
- **Assert:** Each request returns `400` with the corresponding validation error; a subsequent GET confirms no field changed.

#### 6.6. Rejects invalid severity or state without mutation

**Negative**

- **Arrange:** Create a fixture bug and save its current values.
- **Act:** Submit invalid severity and invalid state in separate complete payloads.
- **Assert:** Invalid severity returns `400 blank_severity`; invalid state returns `400 invalid_state`; subsequent GET confirms the original bug is unchanged.

#### 6.7. Rejects incomplete and incorrectly typed payloads

**Negative**

- **Arrange:** Create a fixture bug.
- **Act:** Omit each required replacement field in separate requests, submit a missing body, and submit wrong-typed values.
- **Assert:** Requests return `400` with the corresponding validation error and leave the bug unchanged. PUT is a full replacement operation; partial updates are not supported.

### 7. Delete bug — `DELETE /api/bugs/:id`

#### 7.1. Deletes an existing bug

**Positive**

- **Arrange:** Create a fixture bug and retain its ID.
- **Act:** Request `DELETE /api/bugs/:id`.
- **Assert:** Response is `204` with no response body. A subsequent GET by ID returns `404`.

#### 7.2. Rejects invalid IDs

**Negative**

- **Arrange:** Prepare non-numeric, non-integer, and numeric-prefix IDs.
- **Act:** Send a DELETE request for each.
- **Assert:** Invalid IDs return `400 invalid_id`; no bug is deleted.

As with GET and PUT, the current `parseInt` may treat a numeric-prefix or decimal ID as a valid integer; verify malformed paths cannot delete another record.

#### 7.3. Returns not found for an unknown ID

**Negative**

- **Arrange:** Choose an ID absent from the test database.
- **Act:** Request `DELETE /api/bugs/:id`.
- **Assert:** Response is `404 not_found`.

#### 7.4. Does not delete a different bug

**Positive safety boundary**

- **Arrange:** Create two fixture bugs and retain both IDs.
- **Act:** Delete one ID.
- **Assert:** The selected resource returns `404` on GET; the other remains available and unchanged.

#### 7.5. Rejects repeated deletion

**Negative**

- **Arrange:** Create and successfully delete a fixture bug.
- **Act:** Send DELETE for the same ID again.
- **Assert:** The second request returns `404 not_found`.

## Cross-Cutting Robustness Cases

- Send malformed JSON to body-consuming routes (`POST /api/login`, `POST /api/bugs`, and `PUT /api/bugs/:id`) and verify a controlled `400` response.
- Send a valid JSON scalar or array instead of an object to login/create/update routes. Verify the API returns a controlled `400`, not an uncaught exception.
- Verify validation failures never create, partially update, or delete a resource.
- Verify all 4xx responses use a JSON error body with stable `error` and human-readable `message` fields, except where Express's parser or default 404 currently supplies a different shape. If a consistent error envelope is required, specify it before making those expectations strict.
