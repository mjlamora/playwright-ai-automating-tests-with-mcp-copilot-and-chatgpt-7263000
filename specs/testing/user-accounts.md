# User Accounts Test Plan

## Coverage Assessment

No current test directly validates the `users.json` account store or its invariants. `tests/seed.spec.ts` signs in with the first configured user, but does not assert that the required default account exists or that usernames are unique. Authentication plans cover accepted and rejected login flows; this plan focuses on the account data requirements in `specs/features/02-user-accounts.md`.

## Test Setup

- Read the root `users.json` without modifying it.
- Use the `loginPage` fixture for any browser login scenario.
- Do not print or include account passwords in test output.
- Use Arrange–Act–Assert comments for browser scenarios.

## Test Scenarios

### User accounts

#### 1. Stores valid accounts with unique usernames

**File:** `tests/user-accounts/validates-users-config.spec.ts`

**Arrange:** Load and parse the root `users.json`.

**Act:** Inspect the configured account records.

**Assert:**

- The file contains an array of account records.
- Every record has a non-empty username and password.
- Usernames are unique.

#### 2. Includes the required default account

**File:** `tests/user-accounts/default-account-can-authenticate.spec.ts`

**Arrange:** Verify the default account is represented in `users.json`.

**Act:** Sign in through the Login page using that configured account.

**Assert:** Authentication succeeds and navigates to `/board`.

The login behavior for valid credentials is also covered by `specs/testing/authentication.md`; this scenario specifically protects the required default-account contract.
