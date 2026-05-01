---
name: cr
description: 'Perform structured code review for PRs and local changes. Use for CR, review, bug finding, regression risk analysis, schema/migration checks, API compatibility checks, and missing tests.'
argument-hint: 'What should be reviewed (files, diff, or feature)?'
user-invocable: true
disable-model-invocation: false
---

# Code Review Workflow

## Outcome
Produce a high-signal review focused on correctness, regressions, data safety, and test coverage.

## When to Use
- Reviewing a pull request before merge
- Reviewing local uncommitted changes
- Checking refactors that affect data models, storage, or APIs
- Auditing release-critical changes

## Review Procedure
1. Gather context
- Identify changed files and affected modules.
- Read surrounding code paths, not only the diff.
- Confirm runtime entry points, request handlers, and persistence layers touched by the change.

2. Validate behavior flow end to end
- Trace input to output through parser, service, storage, and API layers.
- Confirm required fields, defaults, and fallback logic.
- Verify backward compatibility for old payloads and old persisted data.

3. Check data and schema safety
- For DB changes, verify table/index constraints and migration path.
- Ensure migration is idempotent and safe on existing data.
- Confirm read paths and write paths are aligned with new schema.

4. Check API and contract compatibility
- Verify request and response shapes remain valid for clients.
- Confirm optional versus required fields are intentional.
- Ensure generated identifiers and versioning rules are deterministic.

5. Check operational reliability
- Validate error handling, logging quality, and failure modes.
- Confirm no hidden destructive behavior in normal flow.
- Check edge cases: empty input, duplicate publishes, missing records, stale data.

6. Verify with execution
- Run targeted compile checks for touched packages.
- Run focused end-to-end or command-level validations for changed flows.
- Prefer isolated test data directories for destructive or stateful verification.

7. Report findings by severity
- Critical: data loss, security, corruption, broken contract, guaranteed runtime failure
- High: likely regressions, migration risk, invalid default behavior
- Medium: edge-case bugs, weak validation, observability gaps
- Low: maintainability or clarity issues

8. Include clear evidence and fixes
- Each finding should include affected file, why it is a bug/risk, and a concrete fix suggestion.
- If no findings, explicitly state no defects found and list residual risks or untested areas.

## Decision Rules
- If behavior changed but tests did not, flag missing tests.
- If schema changed without migration handling, flag as high risk.
- If a field changed from required to optional or the reverse, verify all producers and consumers.
- If release logic depends on time/version generation, verify collision handling and deterministic output.

## Completion Checklist
- All high and critical findings are resolved or accepted with explicit rationale.
- Changed flows are validated with commands or tests.
- Migration and compatibility impact are documented.
- Final review summary is concise and actionable.
