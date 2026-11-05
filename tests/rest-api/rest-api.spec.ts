import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { APIRequestContext, APIResponse, expect, test as baseTest } from "@playwright/test";

type BugPayload = {
  title: string;
  severity: string;
  owner: string;
  description: string;
  state?: string;
};

type Bug = {
  id: number;
  title: string;
  severity: "HIGH" | "MID" | "LOW";
  owner: string;
  description: string;
  state: "OPEN" | "CLOSED";
};

type ConfiguredUser = { username: string; password: string };
type ApiFixtures = {
  api: APIRequestContext;
  createdBugIds: Set<number>;
};

const users = JSON.parse(
  readFileSync(new URL("../../users.json", import.meta.url), "utf8")
) as ConfiguredUser[];
const configuredUser = users[0];

const test = baseTest.extend<ApiFixtures>({
  api: async ({ request }, use) => use(request),
  createdBugIds: async ({ api }, use) => {
    const ids = new Set<number>();
    await use(ids);
    for (const id of ids) {
      const response = await api.delete(`/api/bugs/${id}`);
      if (response.status() !== 204 && response.status() !== 404) {
        throw new Error(`Failed to clean up test bug ${id}: HTTP ${response.status()}`);
      }
    }
  },
});

test.use({ baseURL: "http://localhost:3000" });

function uniqueValue(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function validBug(overrides: Partial<BugPayload> = {}): BugPayload {
  return {
    title: uniqueValue("REST API test bug"),
    severity: "high",
    owner: "API test owner",
    description: "Created by an isolated REST API test.",
    ...overrides,
  };
}

async function createTrackedBug(
  api: APIRequestContext,
  createdBugIds: Set<number>,
  payload = validBug()
): Promise<Bug> {
  const response = await api.post("/api/bugs", { data: payload });
  expect(response.status()).toBe(201);
  const bug = (await response.json()) as Bug;
  createdBugIds.add(bug.id);
  return bug;
}

async function reserveMissingId(
  api: APIRequestContext,
  createdBugIds: Set<number>
): Promise<number> {
  const bug = await createTrackedBug(api, createdBugIds);
  const response = await api.delete(`/api/bugs/${bug.id}`);
  expect(response.status()).toBe(204);
  return bug.id;
}

async function expectApiError(
  response: APIResponse,
  status: number,
  error: string
): Promise<void> {
  expect(response.status()).toBe(status);
  await expect(response.json()).resolves.toMatchObject({
    error,
    message: expect.any(String),
  });
}

async function expectBugUnchanged(api: APIRequestContext, expected: Bug): Promise<void> {
  const response = await api.get(`/api/bugs/${expected.id}`);
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual(expected);
}

test.describe("REST API", () => {
  test.describe("Health", () => {
    test("reports a healthy API and connected database", async ({ api }) => {
      const response = await api.get("/api/health");
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ok: true,
        message: "BuggyBoard API is running",
        database: "connected",
      });
    });

    test("reports a database error when database access is unavailable", async ({ api }) => {
      test.skip(
        true,
        "Requires isolated database fault injection; the configured test server uses the shared database."
      );
      const response = await api.get("/api/health");
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ok: true,
        message: "BuggyBoard API is running",
        database: "error",
      });
    });

    test("does not accept unsupported methods", async ({ api }) => {
      const response = await api.post("/api/health");
      expect(response.status()).toBe(404);
    });
  });

  test.describe("Login", () => {
    test("accepts configured credentials and returns only the trimmed username", async ({ api }) => {
      const response = await api.post("/api/login", {
        data: { username: configuredUser.username, password: configuredUser.password },
      });
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({
        username: configuredUser.username.trim(),
      });
    });

    test("trims surrounding username whitespace", async ({ api }) => {
      const response = await api.post("/api/login", {
        data: {
          username: `  ${configuredUser.username}  `,
          password: configuredUser.password,
        },
      });
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({
        username: configuredUser.username.trim(),
      });
    });

    test("returns the same generic error for an unknown user and a wrong password", async ({
      api,
    }) => {
      const unknownUserResponse = await api.post("/api/login", {
        data: { username: uniqueValue("unknown"), password: "non-empty-password" },
      });
      const wrongPasswordResponse = await api.post("/api/login", {
        data: {
          username: configuredUser.username,
          password: uniqueValue("incorrect-password"),
        },
      });
      await expectApiError(unknownUserResponse, 401, "invalid_credentials");
      await expectApiError(wrongPasswordResponse, 401, "invalid_credentials");
      expect(await unknownUserResponse.json()).toEqual(await wrongPasswordResponse.json());
    });

    test("rejects a blank username", async ({ api }) => {
      const response = await api.post("/api/login", {
        data: { username: "   ", password: "non-empty-password" },
      });
      await expectApiError(response, 400, "blank_username");
    });

    test("rejects a blank password", async ({ api }) => {
      const response = await api.post("/api/login", {
        data: { username: configuredUser.username, password: "" },
      });
      await expectApiError(response, 400, "blank_password");
    });

    test("rejects both credentials when blank", async ({ api }) => {
      const response = await api.post("/api/login", {
        data: { username: "", password: "" },
      });
      await expectApiError(response, 400, "missing_credentials");
    });

    test("validates absent, missing, and incorrectly typed credentials", async ({ api }) => {
      const responses = [
        await api.post("/api/login"),
        await api.post("/api/login", { data: { password: "non-empty-password" } }),
        await api.post("/api/login", {
          data: { username: 42, password: "non-empty-password" },
        }),
        await api.post("/api/login", {
          data: { username: configuredUser.username, password: 42 },
        }),
      ];
      await expectApiError(responses[0], 400, "missing_credentials");
      await expectApiError(responses[1], 400, "blank_username");
      await expectApiError(responses[2], 400, "blank_username");
      await expectApiError(responses[3], 400, "blank_password");
    });

    test("rejects malformed JSON and JSON scalars or arrays with controlled client errors", async ({
      api,
    }) => {
      const malformed = await api.post("/api/login", {
        data: '{"username":',
        headers: { "Content-Type": "application/json" },
      });
      expect(malformed.status()).toBe(400);

      for (const data of ["null", '"credentials"', "[]"]) {
        const response = await api.post("/api/login", {
          data,
          headers: { "Content-Type": "application/json" },
        });
        expect(response.status()).toBe(400);
        if (data === "[]") {
          await expectApiError(response, 400, "missing_credentials");
        }
      }
    });
  });

  test.describe("List bugs", () => {
    test("returns each created bug once with all normalized fields", async ({
      api,
      createdBugIds,
    }) => {
      const fixtures = [
        await createTrackedBug(api, createdBugIds, validBug({ severity: "high" })),
        await createTrackedBug(api, createdBugIds, validBug({ severity: "mid" })),
        await createTrackedBug(
          api,
          createdBugIds,
          validBug({ severity: "low", state: "closed" })
        ),
      ];
      const closedFixture = fixtures[2];
      const updated = await api.put(`/api/bugs/${closedFixture.id}`, {
        data: { ...closedFixture, state: "closed" },
      });
      expect(updated.status()).toBe(200);

      const response = await api.get("/api/bugs");
      expect(response.status()).toBe(200);
      const bugs = (await response.json()) as Bug[];
      for (const fixture of fixtures) {
        expect(bugs.filter((bug) => bug.id === fixture.id)).toHaveLength(1);
        expect(bugs.find((bug) => bug.id === fixture.id)).toEqual(
          expect.objectContaining({
            id: fixture.id,
            title: fixture.title,
            severity: fixture.severity,
            owner: fixture.owner,
            description: fixture.description,
            state: fixture.id === closedFixture.id ? "CLOSED" : "OPEN",
          })
        );
      }
    });

    test("returns an empty array when using an isolated empty test database", async ({ api }) => {
      test.skip(
        true,
        "Requires an isolated empty test database; this server uses the shared application database."
      );
      const response = await api.get("/api/bugs");
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual([]);
    });

    test("returns a server error when a database read fails", async ({ api }) => {
      test.skip(
        true,
        "Requires isolated database fault injection; the configured test server uses the shared database."
      );
      const response = await api.get("/api/bugs");
      expect(response.status()).toBe(500);
    });

    test("returns a JSON array without requiring authentication", async ({ api }) => {
      const response = await api.get("/api/bugs");
      expect(response.status()).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });

  test.describe("Read one bug", () => {
    test("returns a bug by its created ID", async ({ api, createdBugIds }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      const response = await api.get(`/api/bugs/${fixture.id}`);
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(fixture);
    });

    test("rejects a non-numeric ID", async ({ api }) => {
      await expectApiError(await api.get("/api/bugs/abc"), 400, "invalid_id");
    });

    test("returns not found for a numeric ID reserved by this test", async ({
      api,
      createdBugIds,
    }) => {
      const id = await reserveMissingId(api, createdBugIds);
      await expectApiError(await api.get(`/api/bugs/${id}`), 404, "not_found");
    });

    test("rejects decimal and numeric-prefix IDs without resolving another bug", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      for (const id of [`${fixture.id}.5`, `${fixture.id}abc`]) {
        await expectApiError(await api.get(`/api/bugs/${id}`), 400, "invalid_id");
      }
    });
  });

  test.describe("Create bug", () => {
    test("creates and persists every supported severity spelling", async ({
      api,
      createdBugIds,
    }) => {
      const spellings = [
        ["high", "HIGH"],
        ["HIGH", "HIGH"],
        ["mid", "MID"],
        ["MID", "MID"],
        ["low", "LOW"],
        ["LOW", "LOW"],
      ] as const;
      const ids = new Set<number>();

      for (const [severity, normalizedSeverity] of spellings) {
        const payload = validBug({ severity });
        const response = await api.post("/api/bugs", { data: payload });
        expect(response.status()).toBe(201);
        const bug = (await response.json()) as Bug;
        createdBugIds.add(bug.id);
        expect(ids.has(bug.id)).toBe(false);
        ids.add(bug.id);
        expect(bug).toEqual({
          id: expect.any(Number),
          ...payload,
          severity: normalizedSeverity,
          state: "OPEN",
        });
        await expect(api.get(`/api/bugs/${bug.id}`).then((res) => res.json())).resolves.toEqual(
          bug
        );
      }
    });

    test("trims text fields before saving", async ({ api, createdBugIds }) => {
      const payload = validBug({
        title: `  ${uniqueValue("trimmed")}  `,
        owner: "  owner with spaces  ",
        description: "  description with spaces  ",
      });
      const response = await api.post("/api/bugs", { data: payload });
      expect(response.status()).toBe(201);
      const bug = (await response.json()) as Bug;
      createdBugIds.add(bug.id);
      expect(bug).toEqual({
        id: expect.any(Number),
        title: payload.title.trim(),
        severity: "HIGH",
        owner: payload.owner.trim(),
        description: payload.description.trim(),
        state: "OPEN",
      });
      await expectBugUnchanged(api, bug);
    });

    for (const [field, error] of [
      ["title", "blank_title"],
      ["severity", "blank_severity"],
      ["owner", "blank_owner"],
      ["description", "blank_description"],
    ] as const) {
      test(`rejects a blank ${field} without creating a bug`, async ({ api }) => {
        const payload = validBug({ [field]: "   " });
        const response = await api.post("/api/bugs", { data: payload });
        await expectApiError(response, 400, error);
        const bugs = (await (await api.get("/api/bugs")).json()) as Bug[];
        expect(bugs.some((bug) => bug.title === payload.title)).toBe(false);
      });
    }

    test("rejects unsupported severity without creating a bug", async ({ api }) => {
      const payload = validBug({ severity: "critical" });
      await expectApiError(
        await api.post("/api/bugs", { data: payload }),
        400,
        "blank_severity"
      );
      const bugs = (await (await api.get("/api/bugs")).json()) as Bug[];
      expect(bugs.some((bug) => bug.title === payload.title)).toBe(false);
    });

    for (const [field, error] of [
      ["title", "blank_title"],
      ["severity", "blank_severity"],
      ["owner", "blank_owner"],
      ["description", "blank_description"],
    ] as const) {
      test(`rejects a missing ${field}`, async ({ api }) => {
        const payload = validBug();
        const incompletePayload = Object.fromEntries(
          Object.entries(payload).filter(([key]) => key !== field)
        );
        await expectApiError(
          await api.post("/api/bugs", { data: incompletePayload }),
          400,
          error
        );
      });

      test(`rejects a non-string ${field}`, async ({ api }) => {
        const payload = { ...validBug(), [field]: 42 };
        await expectApiError(await api.post("/api/bugs", { data: payload }), 400, error);
      });
    }

    test("rejects an absent body and malformed JSON", async ({ api }) => {
      await expectApiError(await api.post("/api/bugs"), 400, "blank_title");
      const malformed = await api.post("/api/bugs", {
        data: '{"title":',
        headers: { "Content-Type": "application/json" },
      });
      expect(malformed.status()).toBe(400);
    });

    test("rejects JSON scalars and arrays with a controlled validation error", async ({ api }) => {
      for (const data of ["null", '"bug"', "[]"]) {
        const response = await api.post("/api/bugs", {
          data,
          headers: { "Content-Type": "application/json" },
        });
        expect(response.status()).toBe(400);
        if (data === "[]") {
          await expectApiError(response, 400, "blank_title");
        }
      }
    });
  });

  test.describe("Update bug", () => {
    test("replaces all editable values and persists the update", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      const replacement = {
        title: uniqueValue("updated bug"),
        severity: "mid",
        owner: " Updated owner ",
        description: " Updated description ",
        state: "closed",
      };
      const response = await api.put(`/api/bugs/${fixture.id}`, { data: replacement });
      expect(response.status()).toBe(200);
      const updated = (await response.json()) as Bug;
      expect(updated).toEqual({
        id: fixture.id,
        title: replacement.title,
        severity: "MID",
        owner: replacement.owner.trim(),
        description: replacement.description.trim(),
        state: "CLOSED",
      });
      await expectBugUnchanged(api, updated);
    });

    test("normalizes case-insensitive severity and state values", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      const response = await api.put(`/api/bugs/${fixture.id}`, {
        data: { ...fixture, severity: "lOw", state: "oPeN" },
      });
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...fixture,
        severity: "LOW",
        state: "OPEN",
      });
      await expectBugUnchanged(api, {
        ...fixture,
        severity: "LOW",
        state: "OPEN",
      });
    });

    test("rejects invalid IDs without updating the test-owned bug", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      const payload = { ...validBug(), state: "CLOSED" };
      for (const id of ["abc", `${fixture.id}.5`, `${fixture.id}abc`]) {
        await expectApiError(await api.put(`/api/bugs/${id}`, { data: payload }), 400, "invalid_id");
        await expectBugUnchanged(api, fixture);
      }
    });

    test("returns not found when updating a reserved missing ID", async ({
      api,
      createdBugIds,
    }) => {
      const id = await reserveMissingId(api, createdBugIds);
      await expectApiError(
        await api.put(`/api/bugs/${id}`, { data: { ...validBug(), state: "OPEN" } }),
        404,
        "not_found"
      );
    });

    for (const [field, error] of [
      ["title", "blank_title"],
      ["severity", "blank_severity"],
      ["owner", "blank_owner"],
      ["description", "blank_description"],
    ] as const) {
      test(`rejects a blank ${field} without mutation`, async ({
        api,
        createdBugIds,
      }) => {
        const fixture = await createTrackedBug(api, createdBugIds);
        const response = await api.put(`/api/bugs/${fixture.id}`, {
          data: { ...fixture, [field]: "   " },
        });
        await expectApiError(response, 400, error);
        await expectBugUnchanged(api, fixture);
      });
    }

    test("rejects invalid severity and state without mutation", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      await expectApiError(
        await api.put(`/api/bugs/${fixture.id}`, {
          data: { ...fixture, severity: "critical" },
        }),
        400,
        "blank_severity"
      );
      await expectBugUnchanged(api, fixture);
      await expectApiError(
        await api.put(`/api/bugs/${fixture.id}`, {
          data: { ...fixture, state: "pending" },
        }),
        400,
        "invalid_state"
      );
      await expectBugUnchanged(api, fixture);
    });

    for (const [field, error] of [
      ["title", "blank_title"],
      ["severity", "blank_severity"],
      ["owner", "blank_owner"],
      ["description", "blank_description"],
      ["state", "invalid_state"],
    ] as const) {
      test(`rejects missing replacement field ${field} without mutation`, async ({
        api,
        createdBugIds,
      }) => {
        const fixture = await createTrackedBug(api, createdBugIds);
        const payload = Object.fromEntries(
          Object.entries(fixture).filter(([key]) => key !== field)
        );
        await expectApiError(
          await api.put(`/api/bugs/${fixture.id}`, { data: payload }),
          400,
          error
        );
        await expectBugUnchanged(api, fixture);
      });

      test(`rejects non-string replacement field ${field} without mutation`, async ({
        api,
        createdBugIds,
      }) => {
        const fixture = await createTrackedBug(api, createdBugIds);
        await expectApiError(
          await api.put(`/api/bugs/${fixture.id}`, {
            data: { ...fixture, [field]: 42 },
          }),
          400,
          error
        );
        await expectBugUnchanged(api, fixture);
      });
    }

    test("rejects an absent body and malformed JSON without mutation", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      await expectApiError(await api.put(`/api/bugs/${fixture.id}`), 400, "blank_title");
      const malformed = await api.put(`/api/bugs/${fixture.id}`, {
        data: '{"title":',
        headers: { "Content-Type": "application/json" },
      });
      expect(malformed.status()).toBe(400);
      await expectBugUnchanged(api, fixture);
    });

    test("rejects JSON scalars and arrays without mutation", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      for (const data of ["null", '"replacement"', "[]"]) {
        const response = await api.put(`/api/bugs/${fixture.id}`, {
          data,
          headers: { "Content-Type": "application/json" },
        });
        expect(response.status()).toBe(400);
        if (data === "[]") {
          await expectApiError(response, 400, "blank_title");
        }
        await expectBugUnchanged(api, fixture);
      }
    });
  });

  test.describe("Delete bug", () => {
    test("deletes an existing bug and returns no content", async ({ api, createdBugIds }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      const response = await api.delete(`/api/bugs/${fixture.id}`);
      expect(response.status()).toBe(204);
      expect(await response.text()).toBe("");
      await expectApiError(await api.get(`/api/bugs/${fixture.id}`), 404, "not_found");
    });

    test("rejects invalid IDs without deleting a test-owned bug", async ({
      api,
      createdBugIds,
    }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      for (const id of ["abc", `${fixture.id}.5`, `${fixture.id}abc`]) {
        await expectApiError(await api.delete(`/api/bugs/${id}`), 400, "invalid_id");
        await expectBugUnchanged(api, fixture);
      }
    });

    test("returns not found when deleting a reserved missing ID", async ({
      api,
      createdBugIds,
    }) => {
      const id = await reserveMissingId(api, createdBugIds);
      await expectApiError(await api.delete(`/api/bugs/${id}`), 404, "not_found");
    });

    test("deletes only the selected test-owned bug", async ({ api, createdBugIds }) => {
      const selected = await createTrackedBug(api, createdBugIds);
      const other = await createTrackedBug(api, createdBugIds);
      const response = await api.delete(`/api/bugs/${selected.id}`);
      expect(response.status()).toBe(204);
      await expectApiError(await api.get(`/api/bugs/${selected.id}`), 404, "not_found");
      await expectBugUnchanged(api, other);
    });

    test("rejects repeated deletion", async ({ api, createdBugIds }) => {
      const fixture = await createTrackedBug(api, createdBugIds);
      expect((await api.delete(`/api/bugs/${fixture.id}`)).status()).toBe(204);
      await expectApiError(await api.delete(`/api/bugs/${fixture.id}`), 404, "not_found");
    });
  });
});
