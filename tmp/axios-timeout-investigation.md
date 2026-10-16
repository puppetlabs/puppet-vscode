<!--
Document: axios timeout — 5-Whys investigation for failing Forge test in CI
Based on the user's template and job logs at:
https://github.com/puppetlabs/puppet-vscode/actions/runs/38828909612/job/116982457399
Repo commit used for permalinks: b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a
-->

# axios timeout

## Purpose

This investigation traces the single CI symptom (a Mocha timeout in the Forge Tests suite) to a root cause, showing evidence for each causal step and providing a durable fix that addresses the root cause (not only the symptom). It answers:

- What failed and how we observed it?
- What causal chain connects that failure to a fix, with evidence at each step?
- What is the proven root cause and the recommended solution to prevent recurrence?

Evidence sources used
- GitHub Actions job logs for the failing run (user-provided): https://github.com/puppetlabs/puppet-vscode/actions/runs/38828909612/job/116982457399
- Repository files at commit b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a:
  - src/forge.ts (getPDKVersion and related methods): https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/forge.ts#L1-L106
  - src/test/suite/links.test.ts (examples of tests performing network calls): https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/test/suite/links.test.ts#L1-L28

---

## Background

- Symptom (observed): Nightly CI job fails with Mocha reporting "1 failing" — specifically: "Forge Tests -> Retrieves latest PDK version: Error: Timeout of 2000ms exceeded." The job log contains multiple Axios errors (HTTP 403) and "Sending request failed." lines immediately before the Mocha timeout summary.

- Impact: The nightly CI run exits non-zero, masking test results and creating flakiness in continuous validation.

---

## Root Cause Analysis

### Why did the CI job fail with "1 failing" (timeout)?

Why This Tool
- The GitHub Actions job log is the canonical, first-hand record of what happened during the CI run — it shows the test runner output, HTTP errors, and the exact Mocha timeout error. Inspecting the log is the direct way to establish the symptom.

Investigation
```bash
# Open the CI job URL (user-provided) and read the logs at the time of failure.
# Example investigative commands you can run locally if you have the repo:
git clone https://github.com/puppetlabs/puppet-vscode.git
cd puppet-vscode
git checkout b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a
# Run tests as the CI does (compiled output):
npm ci
npm run compile
node ./out/test/runtest.js
```

Evidence
- Job log excerpts (exact lines extracted from the run):
  - "rejected promise not handled within 1 second: AxiosError: Request failed with status code 403"
  - "Request failed with status code 403: AxiosError: Request failed with status code 403"
  - "Sending request failed."
  - "Error: 1 tests failed."
  - "1) Forge Tests Retrieves latest PDK version: Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure \"done()\" is called; if returning a Promise, ensure it resolves. (/home/runner/work/puppet-vscode/puppet-vscode/out/test/suite/forge.test.js)"

Answer
- The CI job failed because one test hit Mocha's 2000ms timeout. Log lines immediately before the timeout show axios HTTP errors (403) and request failures, implicating network request handling in the test path.

Next Problem
- Which code path performed the failing HTTP request and why did that operation leave the test pending until timeout?

---

### Why did the test's network operation leave Mocha waiting until timeout?

Why This Tool
- To answer whether the code under test handled axios rejections, inspect the source implementation that the test calls. Looking at the function that fetches the PDK version will reveal whether errors are caught and whether the returned Promise is always settled.

Investigation
- Open the source that performs the PDK fetch: src/forge.ts at commit b2eb946e...
  - Link: https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/forge.ts#L34-L106

Evidence (code excerpt)
```typescript
export function getPDKVersion(logger: ILogger): Promise<string> {
  return new Promise((resolve) => {
    return axios
      .get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST', {
        params: { exclude_fields: 'readme changelog license reference' },
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'User-Agent': `puppet-vscode/${getVersion()}`,
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          logger.error(`Error getting Puppet forge data. Status: ${response.status}:${response.statusText}`);
          resolve(undefined);
        }
        resolve(response.data);
      });
  });
}
```

- The function wraps axios.get(...).then(...) but does not attach .catch(...) to handle rejected promises.

Code Sample — what it does (3 bullets)
- It creates and returns a new Promise that only calls resolve(...) inside axios.then(...).
- If axios rejects (network error, 403), there is no .catch to call resolve(undefined) or reject, so the outer Promise remains pending.
- A pending Promise means the test awaiting getPDKVersion never resolves, causing Mocha to wait until its timeout triggers.

Answer
- getPDKVersion lacks error handling for axios rejections; when axios rejects (e.g., HTTP 403 or network error), the function's returned Promise stays unresolved, leaving the test pending until Mocha's timeout.

Next Problem
- Why did axios reject with 403 in CI? Is the 403 caused by incorrect headers/credentials, remote policy, or something else?

---

### Why did axios return 403 in CI?

Why This Tool
- Logs show only status codes and not the response body or request headers. To determine the reason for a 403 we must (a) inspect what the code sends (headers, UA, query params), and (b) consider external policies (IP blocking, rate limits). Inspecting the request in code plus the CI context is the fastest way to find likely causes.

Investigation
- Check request construction in getPDKVersion (we saw headers and params). Review other network-using tests for similar patterns (e.g., links.test.ts performs axios.get against external links).
  - links.test.ts: https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/test/suite/links.test.ts#L1-L28

Evidence (exact log lines and code observations)
- Job log: "AxiosError: Request failed with status code 403"
- getPDKVersion request headers include a User-Agent value: `'User-Agent': `puppet-vscode/${getVersion()}``
- getPDKVersion uses the S3 URL: https://s3.amazonaws.com/puppet-pdk/pdk/LATEST
- links.test.ts contains tests that call axios.get(link).then(...), and some of those tests show "Sending request failed." in the job log (these tests also perform external HTTP calls).

Answer (evidence-based claim)
- The 403 is a server-side refusal of the request. The exact cause of the 403 (missing credentials, IP blocking, rate limiting, or S3 bucket policy) is not determinable from the CI job logs alone — we have not been given the response body, remote logs, or the exact server reason. Therefore the specific cause is **Inferred, not proven.**
  - Upgrade path to proof:
    - Capture the full axios error object in CI logs (error.response.data / headers) by enhancing the code/logger or running a one-off debug job to print the response body.
    - Reproduce the request from the CI runner (curl) to see the server message.
    - Obtain server-side logs / vendor advisory indicating blocking of GitHub Actions IP ranges.

Next Problem
- What change to code/tests will prevent a 403 or similar failure from causing Mocha to timeout in CI?

---

## Root Cause

Root Cause (concise)
- The Forge test triggers an outbound HTTP request through getPDKVersion. When the remote request fails (e.g., HTTP 403 or a network error), getPDKVersion fails to settle its returned Promise (it lacks .catch), leaving the test hung until Mocha's default 2000ms timeout is exceeded.

Proof
- Test failure evidence in CI logs: repeated Axios 403 errors and then Mocha timeout for the forge test (job logs cited above).
- Source evidence: getPDKVersion implementation (commit-pinned) lacks a .catch and returns a Promise that only resolves in the .then path: https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/forge.ts#L34-L106
- Demonstration (behavioral proof you can run):
  - Locally, a simple test that stubs axios.get to reject while calling current getPDKVersion will hang (outer Promise stays pending). You can reproduce by stubbing axios.get to return a rejected Promise and verifying getPDKVersion never resolves — this reproduces the CI symptom.
- Known Issue?
  - No issue ID surfaced in the job logs or repository (no existing ticket referenced). I did not find a prior issue linking this exact root cause in the provided changelog. **Inferred, not proven.**
    - Upgrade path: search issue/PR tracker for "forge getPDKVersion", "PDK LATEST", or the specific test name to prove whether this is a known flakiness.

---

## Solution

Explain the fix that addresses the root cause
- Replace getPDKVersion implementation with one that always settles the returned Promise, by:
  - Using async/await,
  - Adding a request timeout,
  - Catching errors and returning undefined on failure (consistent with other functions in src/forge.ts that return undefined on error).

Concrete patch (apply to src/forge.ts; commit-pinned source shown earlier).
- Replace current getPDKVersion with the following implementation:

```typescript
// Proposed replacement for src/forge.ts getPDKVersion
export async function getPDKVersion(logger: ILogger): Promise<string | undefined> {
  try {
    const response = await axios.get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST', {
      params: {
        exclude_fields: 'readme changelog license reference',
      },
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': `puppet-vscode/${getVersion()}`,
      },
      timeout: 5000, // fail fast in CI
    });

    if (response.status !== 200) {
      logger.error(`Error getting Puppet PDK data. Status: ${response.status}:${response.statusText}`);
      return undefined;
    }

    return response.data;
  } catch (error) {
    logger.error(`Error getting Puppet PDK data: ${String(error)}`);
    return undefined;
  }
}
```

Code Evidence (source link + sample)
- Source link (current code to be replaced): https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/forge.ts#L34-L106
- Small code sample (what we replaced — shown above).
- Why this matters:
  - Ensures that network errors are caught and the function returns a settled Promise (undefined on error) instead of leaving the promise pending.
  - Aligns behavior with other functions in the file (getModuleInfo, getPuppetModuleCompletion) which already call .catch and resolve(undefined).

Additional recommended test hardening (required durable change)
- Stop executing real external HTTP calls in unit tests:
  - Mock network requests in unit tests (preferred): use nock or sinon to stub axios.get. This makes unit tests deterministic and avoids external 403s or rate-limiting interfering with CI.
  - If a real network test is needed, mark it as an integration test and gate it behind an environment variable (e.g., RUN_INTEGRATION_TESTS=true) so CI can opt into it, or run it in a separate pipeline with credentials.

Example test change (evidence + snippet)
- Current problematic test pattern in src/test/suite/links.test.ts (calls axios.get(...).then(...) but does not return / await the Promise):
  - Link: https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/test/suite/links.test.ts#L1-L28

Code Sample — problematic test (excerpt)
```typescript
links.forEach((link) => {
  it(`Extension metadata: should return 200 for ${link}`, async () => {
    axios.get(link).then((response) => {
      assert.strictEqual(response.status, 200);
    });
  });
});
```

- Problems with this test:
  - It calls axios.get(...).then(...) but does not return the Promise from the test function nor await it, so Mocha may not wait properly and unhandled rejections can occur.
  - It exercises network in unit test context.

Suggested test fixes (two options)

A) Mock axios in tests (sinon) — deterministic
```javascript
// Example snippet in the test file
const sinon = require('sinon');
const axios = require('axios');

describe('Vendored link checks', () => {
  let getStub;
  beforeEach(() => { getStub = sinon.stub(axios, 'get'); });
  afterEach(() => { getStub.restore(); });

  it('Extension metadata: should return 200 for https://example', async () => {
    getStub.resolves({ status: 200, data: 'OK' });
    const response = await axios.get('https://example');
    assert.strictEqual(response.status, 200);
  });
});
```

B) If real HTTP is required: return/await original promise and make assertions explicit; consider gating
```typescript
it(`Extension metadata: should return 200 for ${link}`, async () => {
  const response = await axios.get(link);
  assert.strictEqual(response.status, 200);
});
```

Why this fixes the problem
- The getPDKVersion change prevents an un-settled Promise when axios rejects, so tests that await it will not hang.
- Mocking or properly awaiting axios calls in tests prevents external network failures (403s) from causing unpredictable timeouts.

Source (where fix patterns come from)
- axios docs: https://github.com/axios/axios
- nock (HTTP mocking): https://github.com/nock/nock
- sinon (stubbing): https://sinonjs.org/
- Mocha async best-practices (return Promises or use async/await): https://mochajs.org/#asynchronous-code

Verification plan (how to prove the fix works)
1. Implement the getPDKVersion change in a feature branch, update tests (mock or await).
2. Run tests locally:
   - npm ci
   - npm run compile
   - node ./out/test/runtest.js
   - Expect: no Mocha timeout for "Retrieves latest PDK version".
3. Push the branch / open PR and monitor CI job at:
   - https://github.com/puppetlabs/puppet-vscode/actions/runs/38828909612 (or the PR run)
4. Evidence of success: CI logs that show Forge tests passing or failing deterministically (no pending-promises/timeouts). Attach commit and CI run links.

---

## Related Topics / Follow-ups (evidence discipline)

- Convert inferred claims to proof:
  - Claim: "403 was due to server-side policy (IP blocking) or missing credentials." — currently **Inferred, not proven.**
    - Upgrade-to-proof actions:
      - Add enhanced logging in getPDKVersion to log error.response.status/text/body for failed responses and re-run CI on a debug branch.
      - Run a curl from a GitHub Actions runner to the same URL to inspect server message.
      - If server logs can be obtained (vendor or S3 log access), inspect them for blocking reason.
    - Reason not proven here: job logs only contain axios error and status, not server body or remote logs.
- Add a gated integration test:
  - If end-to-end verification is necessary (fetching the live PDK LATEST), implement a dedicated integration test that runs only when RUN_INTEGRATION_TESTS=true and in an environment with required access.
- Tests to change:
  - Replace network-using unit tests to use nock or sinon stubs. Example locations: src/test/suite/links.test.ts and relevant Forge tests.

Relevant permalinks used in this investigation
- getPDKVersion in src/forge.ts: https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/forge.ts#L34-L106
- links.test.ts (example network tests): https://github.com/puppetlabs/puppet-vscode/blob/b2eb946e0bb5d0b09e1b2f2ada0f4263c47a802a/src/test/suite/links.test.ts#L1-L28
- CI job (user-provided): https://github.com/puppetlabs/puppet-vscode/actions/runs/38828909612/job/116982457399

---

## Final checklist (compliance with the template)

- Heading structure follows the template.
- Purpose section is specific to this investigation.
- Each Why heading has:
  - Why This Tool (stated).
  - Investigation (commands or repo paths shown).
  - Evidence (quoted log lines or code excerpts).
  - Answer (conclusion supported by evidence).
  - Next Problem (explicit).
- Root Cause includes Proof and Known Issue? (the Known Issue is noted as not found; marked **Inferred, not proven.** with an upgrade path).
- Solution targets the root cause and includes Source references.
- Every code reference above includes a permalink and a short code excerpt with 1-3 explanatory bullets (see getPDKVersion and links.test.ts).
- Inferred claims are labeled **Inferred, not proven.** and include what would prove them and why not proven here.

---

If you want, I can now:
- Create a branch and open a PR that (a) replaces getPDKVersion with the proposed async/catch implementation and (b) updates the failing Forge test to stub axios (sinon) or use nock, and then post the PR diff and CI run link; or
- Only create the minimal hotfix PR for getPDKVersion and leave tests for a follow-up PR.

Choose which PR approach you want and I will prepare the changes and the exact diffs (with commit-pinned permalinks).
