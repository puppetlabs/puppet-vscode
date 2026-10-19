<!--
five_why_axios-timeout.md
Five-Why investigation for: Mocha timeout in Forge Tests caused by outbound HTTP 403s
Repo commit used for permalinks: ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2
CI job: https://github.com/puppetlabs/puppet-vscode/actions/runs/39180562201/job/117832213141

This document follows the fivewhy-template.md and records the chain investigated so far. It stops where proof is missing and defines the core question and the simplest replication steps to drive the next Why.
-->

# axios timeout (fivewhy)

## Purpose

This investigation traces the failing CI test "Retrieves latest PDK version" (Mocha timeout) to the immediate cause(s) observed in the job logs and then defines the next, smallest reproducible experiment that will prove or refute the suspected root causes. It answers:

- What failed and how was it observed?
- What evidence ties the failure to an outbound HTTP 403 response?
- What is the next core question to investigate, and how can you reproduce the failure simply on the command line so the next Why can be resolved?

## Background

Symptom observed in CI run: the nightly job fails with one Mocha test timing out.

- CI job (failing): https://github.com/puppetlabs/puppet-vscode/actions/runs/39180562201/job/117832213141
- Test: `Forge Tests -> Retrieves latest PDK version` from `src/test/suite/forge.test.ts` (see test call to `forge.getPDKVersion`)
  - Test call: [`src/test/suite/forge.test.ts:15-21`](https://github.com/puppetlabs/puppet-vscode/blob/ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2/src/test/suite/forge.test.ts#L15-L21)

The extension code that fetches the PDK version is here:
- `getPDKVersion` in [`src/forge.ts:45-64`](https://github.com/puppetlabs/puppet-vscode/blob/ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2/src/forge.ts#L45-L64)

Observed effect: multiple AxiosError 403 messages appear in the job log immediately before the Mocha timeout and the runner exits non-zero.

## Root Cause Analysis

### Why did the test time out while retrieving the PDK version?

**Why This Tool**: The CI job log is the authoritative record of test output and network errors for this run; it directly shows the Mocha timeout and the Axios errors that preceded it.

**Investigation**:

- Inspect the failing job log for the Mocha timeout and the Axios error messages.
  - CI job URL: https://github.com/puppetlabs/puppet-vscode/actions/runs/39180562201/job/117832213141

**Evidence** (quoted exact log lines):

- Axios errors (repeated in the log):

```
rejected promise not handled within 1 second: AxiosError: Request failed with status code 403
stack trace: AxiosError: Request failed with status code 403
	at settle (/home/runner/work/puppet-vscode/puppet-vscode/node_modules/axios/dist/node/axios.cjs:2530:12)
	at IncomingMessage.handleStreamEnd (/home/runner/work/puppet-vscode/puppet-vscode/node_modules/axios/dist/node/axios.cjs:4772:11)
```

- Mocha timeout and failing test summary (exact lines):

```
Error: 1 tests failed.
1) Forge Tests
   Retrieves latest PDK version:
Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/home/runner/work/puppet-vscode/puppet-vscode/out/test/suite/forge.test.js)
```

**Answer**: The test timed out because the Promise returned by `forge.getPDKVersion` did not resolve within the Mocha default timeout (2000ms), and the job logs show Axios HTTP 403 responses for outbound requests in the same time window.

**Code Location**:
- `getPDKVersion` implementation: [`src/forge.ts:45-64`](https://github.com/puppetlabs/puppet-vscode/blob/ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2/src/forge.ts#L45-L64)

**Next Problem**: Why is the HTTP request to the PDK endpoint returning 403 for the CI test runner?


### Why is the PDK/S3 endpoint returning HTTP 403 for the CI runner requests?

**Why This Tool**: To determine whether the 403 is caused by the request details (headers, user-agent, query params) or by the caller's network identity (source IP, CI environment), the quickest direct test is an HTTP request that matches the code's request shape — same URL and headers — executed from a similar environment. `curl` or a minimal Node script reproduces the exact request shape and is easy to run locally or inside a GitHub Actions job.

**Investigation (replication steps — simplest possible commands):**

- Minimal curl reproducer (command-line):

```bash
# Replace <USER_AGENT> with a plausible package version string (e.g. puppet-vscode/0.0.0)
curl -i \
  -H "Content-Type: application/json;charset=UTF-8" \
  -H "User-Agent: puppet-vscode/0.0.0" \
  'https://s3.amazonaws.com/puppet-pdk/pdk/LATEST?exclude_fields=readme,changelog,license,reference'
```

- Minimal Node + axios reproducer (same headers as code): create file `repro-pdk.js` and run `node repro-pdk.js`:

```javascript
// repro-pdk.js
const axios = require('axios');
axios.get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST', {
  params: { exclude_fields: 'readme changelog license reference' },
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent': 'puppet-vscode/0.0.0',
  },
  timeout: 10000,
})
.then(r => { console.log('status', r.status); console.log('body', r.data); })
.catch(e => { if (e.response) console.log('status', e.response.status, e.response.statusText); else console.error(e); });
```

- Run the same curl inside a GitHub Actions job step (this will test from the actual runner network location):

```yaml
# .github/workflows/debug-pdk.yml - ephemeral debug job
name: debug-pdk
on: workflow_dispatch
jobs:
  repro:
    runs-on: ubuntu-latest
    steps:
      - name: Check curl to PDK LATEST
        run: |
          curl -i -H "Content-Type: application/json;charset=UTF-8" -H "User-Agent: puppet-vscode/0.0.0" 'https://s3.amazonaws.com/puppet-pdk/pdk/LATEST?exclude_fields=readme,changelog,license,reference' || true
```

**Evidence**: (To be collected by running the above commands.)

- Currently we do NOT have first-hand evidence from these experiments in this investigation. The observation that CI logs contain Axios 403s is proven (linked above). Whether the 403 is reproducible from a local machine or from the GitHub Actions runner is **Inferred, not proven.**

  - **Inferred, not proven.** — claim: "the remote endpoint is blocking GitHub Actions IP addresses". Upgrade path: run the GitHub Actions `debug-pdk` job above which curls the endpoint from the same runner network; if it returns 403, that proves the runner-origin blocking hypothesis. Reason-not-verified: this investigation has not yet run that job.

**Answer**: At this point the most likely causes are:

- The remote endpoint is rejecting requests from the CI runner's network (IP-based block) (**Inferred, not proven.** — see upgrade path above).
- Or the remote endpoint requires different headers/authorization/user-agent and is rejecting requests that look like automated CI traffic (**Inferred, not proven.** — see replication steps to test header variations).

**Next Problem (core question to resolve next)**: Can we reproduce the 403 from the GitHub Actions runner or from a minimal request that matches the code's headers? If yes, what exact request shape gets a 403 and what shape succeeds?


## Root Cause

- Root cause is not proven yet. The job logs prove that Axios received HTTP 403s and a Mocha timeout occurred. The causal link from 403 → Mocha timeout is proven by log chronology, but the deeper cause (why the endpoint returned 403) remains unproven and requires the replication steps above.

**Proof required**: Run the `curl` or `repro-pdk.js` reproducer on the same runner network (GitHub Actions) and observe the status code. If the runner returns 403, that proves the endpoint is denying requests from CI (or at least from that runner region/IP). If the runner returns 200 but local machines do not, that flips the hypothesis.

**Known Issue?**: No prior incident ticket is linked here. Search the tracker for "puppet-pdk LATEST 403" or similar if you want to detect prior reports. At time of writing, no linked ticket is present in this investigation.


## Solution (temporary and durable)

- Temporary mitigation (if CI must pass immediately):
  - Mock/stub network calls in the test suite so they do not depend on external services in CI — e.g., stub `forge.getPDKVersion` to return a fixed value during unit tests. This avoids flaky external dependencies.

- Durable fix (once root cause is proven):
  - If the endpoint is blocking CI IPs, open a support ticket with the endpoint owner (Puppet S3/hosting team) and request a reason or whitelist for CI IP ranges, or host a stable mirror accessible to CI.
  - If the endpoint requires different headers/credentials, update the code to include required headers or use an authenticated endpoint.

**Source**: not yet applicable — the durable fix depends on which hypothesis the reproducible test proves.


## Replication commands (copy/paste)

- Quick local curl (may or may not reproduce the CI 403):

```bash
curl -i -H "Content-Type: application/json;charset=UTF-8" -H "User-Agent: puppet-vscode/0.0.0" 'https://s3.amazonaws.com/puppet-pdk/pdk/LATEST?exclude_fields=readme,changelog,license,reference'
```

- Node repro:

```bash
cat > repro-pdk.js <<'JS'
const axios = require('axios');
axios.get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST', {
  params: { exclude_fields: 'readme changelog license reference' },
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent': 'puppet-vscode/0.0.0',
  },
  timeout: 10000,
}).then(r => { console.log('status', r.status); console.log('body', r.data); }).catch(e => { if (e.response) console.log('status', e.response.status, e.response.statusText); else console.error(e); });
JS

node repro-pdk.js
```

- Quick GitHub Actions repro (recommended): create the ephemeral workflow shown above and run it via the Actions UI (Workflow Dispatch). It will show whether the runner network sees 403.


## Related Topics

- Test: [`src/test/suite/forge.test.ts:15-21`](https://github.com/puppetlabs/puppet-vscode/blob/ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2/src/test/suite/forge.test.ts#L15-L21)
- Code: `getPDKVersion` implementation: [`src/forge.ts:45-64`](https://github.com/puppetlabs/puppet-vscode/blob/ebe58cb35af9fd1aed5ef9cfa10bd011e79fb6c2/src/forge.ts#L45-L64)
- CI job: https://github.com/puppetlabs/puppet-vscode/actions/runs/39180562201/job/117832213141


## Next actions (explicit and actionable)

- Run the GitHub Actions ephemeral `debug-pdk` job (recommended) to see if the runner network returns 403. Command: create `.github/workflows/debug-pdk.yml` with the snippet above and trigger via the repository Actions -> Workflows -> debug-pdk -> Run workflow.
- If the job returns 403, capture the full `curl -v` output and open a support ticket with the endpoint owner, attaching the job log and the `curl -v` output.
- Additionally, add a unit-test change to mock `forge.getPDKVersion` so CI is not blocked while we investigate.


<!-- End of investigation -->
