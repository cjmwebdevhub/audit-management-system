# Audit Management System (AMS)

A modular Single-Page Application for end-to-end internal audit management, covering all six workflow stages defined in the AMS Workflow document.

---

## Project Structure

```
audit-management-system/
│
├── app/                          # Front-End SPA (Vite-ready Vanilla JS)
│   ├── index.html                # Root HTML template — no inline scripts or styles
│   └── src/
│       ├── styles.css            # Global stylesheet (extracted from legacy index.html)
│       ├── main.js               # Entry point — bootstraps session & initial render
│       │
│       ├── data/
│       │   └── db.js             # In-memory data store (simulates DynamoDB amsdata table)
│       │
│       ├── utils/
│       │   ├── helpers.js        # Shared UI primitives: toast, badge, modal, fmt, etc.
│       │   └── navigation.js     # SPA client-side router (navigate function)
│       │
│       ├── components/           # One file per application module / workflow stage
│       │   ├── dashboard.js      # KPI overview, workflow status, recent activity
│       │   ├── universe.js       # Stage 1 — Audit Universe & Risk Assessment
│       │   ├── plan.js           # Stage 2 — Annual Audit Plan & Team Assignment
│       │   ├── engagements.js    # Stage 3 — Engagement Readiness & Cockpit
│       │   ├── fieldwork.js      # Stage 4 — Fieldwork, Notes & Findings review
│       │   ├── docreqs.js        # Document Requests (DRL / Auditee Submissions)
│       │   ├── reporting.js      # Stage 5 — Report Assembly & CAE Approval
│       │   ├── issues.js         # Stage 6 — Issues & 4-Tier Closure Workflow
│       │   ├── iam.js            # Users, Roles & Invitations (data/iam collection)
│       │   └── trail.js          # Tamper-Proof Audit Trail viewer
│       │
│       ├── adapters/             # (Production) Drop-in runtime adapters
│       │   ├── aws-runtime.js    # Replaces window.claude — wraps API Gateway REST calls
│       │   ├── cognito-auth.js   # PKCE OIDC token manager (Amazon Cognito)
│       │   └── websocket-client.js # WebSocket live-listener with 30s polling fallback
│       │
│       └── vendor/               # Self-hosted third-party assets
│           └── (JSZip 3.10.1, IBM Plex font binaries)
│
├── api/                          # Back-End — Node.js 22 (arm64) Lambda Functions
│   └── src/
│       ├── middleware/
│       │   ├── authorizer.js     # Server-side 31-authorization & 10-role validator
│       │   └── request-validator.js  # Schema assertions & input sanitization
│       ├── handlers/
│       │   ├── crud-handler.js   # REST /collections/{name}/docs/{id}
│       │   ├── files-handler.js  # S3 pre-signed PUT/GET URL generator
│       │   ├── ws-connect.js     # WebSocket $connect / $disconnect
│       │   ├── ws-fanout.js      # DynamoDB Streams fanout dispatcher
│       │   ├── report-engine.js  # DOCX assembler & automated issue release worker
│       │   └── email-handler.js  # Amazon SES transactional notifications
│       └── lib/
│           ├── dynamodb.js       # DocumentClient wrapper with optimistic locking
│           └── s3.js             # S3 KMS + Object Lock manager
│
├── infra/                        # Infrastructure as Code (AWS CDK TypeScript)
│   ├── bin/app.ts
│   ├── lib/
│   │   ├── edge-stack.ts         # CloudFront, Route 53, WAF, ACM
│   │   ├── identity-stack.ts     # Cognito User Pool, Clients, IdP Federation
│   │   ├── api-stack.ts          # HTTP API, WebSocket API, Lambdas
│   │   ├── storage-stack.ts      # DynamoDB tables, Evidence & Site S3 buckets
│   │   └── security-stack.ts     # KMS CMKs, GuardDuty, Security Hub, AWS Backup
│   └── params/
│       ├── uat.json              # Sandbox SES, local users, test IdP
│       └── prod.json             # Strict WAF, Object Lock, Corporate IdP, MFA
│
└── scripts/
    ├── migration-export.js       # Dumps collections & assets from Claude runtime
    └── migration-import.js       # DynamoDB batch loader & S3 evidence populator
```

---

## Running Locally (Current Phase)

The front-end is a plain HTML/JS SPA with **no build step required**. Open `app/index.html` directly in a browser or serve with any static server:

```bash
# Python (any directory)
cd app && python3 -m http.server 8080

# Node (npx)
cd app && npx serve .
```

Then visit `http://localhost:8080`.

---

## Six Workflow Stages

| Stage | Module | Description |
|-------|--------|-------------|
| 1 | `universe.js` | Register auditable entities; rate Likelihood × Impact → Risk Score |
| 2 | `plan.js` | Compile annual plan; auto-assign teams by capacity weight |
| 3 | `engagements.js` | 9-point readiness checklist; generate NL / DRL letters |
| 4 | `fieldwork.js` | Working notes & findings; Draft → Head Review → Indep. Review → Cleared |
| 5 | `reporting.js` | Assemble report; Lead → CAE approval; auto-generate issues on final approval |
| 6 | `issues.js` | 4-tier closure: Owner → Auditee Head → Auditor → Lead → Closed; contest path |

---

## Data Collections (DynamoDB Single-Table Design)

| Collection | pk | sk | Description |
|------------|----|----|-------------|
| `auditables` | `"auditables"` | `ENT-###` | Audit Universe entities |
| `audits` | `"audits"` | `AUD-YYYY-NNN` | Engagement records |
| `notes` | `"notes"` | `auditId#WN-###\|F-###` | Working notes & findings |
| `noteVersions` | `"noteVersions"` | `auditId#ref#vN` | Word-diff revision history |
| `files` | `"files"` | `auditId#fileId` | S3 evidence metadata |
| `docreqs` | `"docreqs"` | `auditId__reqId` | Auditee document requests |
| `issues` | `"issues"` | `AUD-YYYY-NNN-F-###` | Remediation tracking |
| `data/iam` | `"data/iam"` | `AUDR-###\|USR-###\|SIG-###` | Users & roles |
| `trail` | `"trail"` | `timestamp#uuid` | Immutable audit trail |

---

## Production Target Architecture

| Layer | Technology |
|-------|-----------|
| CDN / Edge | Amazon CloudFront + AWS WAF + HSTS |
| Identity | Amazon Cognito (SAML/OIDC → Entra ID) |
| API | AWS API Gateway HTTP + WebSocket APIs |
| Compute | AWS Lambda Node.js 22 arm64 |
| Database | Amazon DynamoDB single-table (amsdata) with Streams |
| Storage | Amazon S3 — KMS-encrypted, versioned, Object Lock (Governance) |
| Scanning | Amazon GuardDuty Malware Protection on evidence bucket |
| Email | Amazon SES |
| Region | ap-southeast-1 (Singapore); DR → Jakarta or Tokyo |

---

## File Responsibilities at a Glance

| File | Responsibility |
|------|---------------|
| `app/index.html` | HTML shell only — no logic, no styles inline |
| `app/src/styles.css` | All CSS variables, layout, components, utilities |
| `app/src/data/db.js` | Data store — swap with `aws-runtime.js` calls for production |
| `app/src/utils/helpers.js` | `toast`, `badge`, `modal`, `closeModal`, `fmt`, `userName`, `riskClass`, `switchTab` |
| `app/src/utils/navigation.js` | `navigate(page)` — router + title + renderer dispatch |
| `app/src/components/*.js` | One render function per stage, self-contained, no cross-imports |
| `app/src/main.js` | `init()` — session bootstrap, badge refresh, first render |
