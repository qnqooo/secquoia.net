# Aggy Agentic Benchmark 25

Date: 2026-08-05  
Candidate status: `CANDIDATE_NOT_PROMOTED`  
Scope: public capabilities documented by vendors and projects. No proprietary prompt, model weight, interface, branding, or internal implementation was copied.

## Executive decision

Aggy should not become a clone of one product. The strongest operating model is a governed combination of:

1. natural, interruptible, context-aware conversation;
2. SQAILE supervision with small QuX specialists and bounded handoffs;
3. explicit modes for conversation, consulting, research, guided workflows, and incident support;
4. durable, resumable work with visible milestones;
5. user-controlled, purpose-limited memory;
6. evidence, confidence, cost, latency, and outcome telemetry;
7. human approval before every external side effect;
8. QuFense fail-closed enforcement, QuIdentify-scoped identity, QuOptio routing, QuAudit evidence, and preserved E2EE/PQC.

Human-like means attentive, warm, adaptive, direct, interruptible, and able to remember the current purpose. It does not mean pretending to be human. Aggy exposes concise plans, reasons, evidence, uncertainty, and next actions, but never private chain-of-thought.

## Benchmark

| # | Agent/platform | Public differentiator | Pattern adopted in Aggy |
|---:|---|---|---|
| 1 | OpenAI Agents SDK | Handoffs, guardrails, tracing, sandboxed long-horizon work | Governed handoffs and traceable execution |
| 2 | Claude Agent SDK | Permissions, hooks, sessions, checkpoints, subagents | Approval-aware tools and resumable checkpoints |
| 3 | Google ADK | Workflow and dynamic routing, delegation, trajectory evaluation | Specialist routing with trajectory tests |
| 4 | Microsoft Copilot Studio | Voice, enterprise grounding, channels, governance, analytics | Multichannel continuity tied to business outcomes |
| 5 | Microsoft Foundry Agent Service | Agent identity, isolation, tracing, evaluation, lifecycle | Per-agent identity and governed promotion |
| 6 | Amazon Bedrock AgentCore | Runtime isolation, memory, identity, policy, evaluation, optimization | Deterministic tool policy and continuous evaluation |
| 7 | IBM watsonx Orchestrate | Central control plane and nested collaboration | SQAILE supervisor with bounded QuX collaborators |
| 8 | Salesforce Agentforce | Enterprise data/actions and commercial reasoning | Contextual next-best commercial action |
| 9 | ServiceNow AI Agents | Agent teams, Control Tower, workflow automation | Operational control tower and human escalation |
| 10 | Oracle AI Agent Studio | Business-object tools and embedded workflows | Validated domain tools with visible prerequisites |
| 11 | SAP Joule Studio | Small specialized agents and process context | Role-specific QuX specialists |
| 12 | LangGraph | Durable execution, persistence, streaming, human-in-loop | Interruptible, checkpointed workflows |
| 13 | CrewAI | Crews, flows, guardrails, memory, observability | Bounded role collaboration |
| 14 | AutoGen | Teams, handoffs, group chat, selector routing | Dynamic selection without unbounded loops |
| 15 | Semantic Kernel | Sequential, concurrent, handoff, and group orchestration | Pattern chosen according to task topology |
| 16 | Perplexity Agent API | Web research, citations, filters, structured results | Source-aware research mode on demand |
| 17 | NVIDIA NeMo Agent Toolkit | Framework-neutral profiling, evaluation, MCP/A2A | Provider-neutral telemetry and adapters |
| 18 | Snowflake Cortex Agents | Governed data and isolated code execution | Least-privilege enterprise grounding |
| 19 | UiPath Maestro | Agents, robots, humans, APIs, durable BPMN | Human-agent-process coordination |
| 20 | Databricks Mosaic AI Agent Evaluation | Production traces, judges, custom metrics, expert labels | Evidence-based regression evaluation |
| 21 | GitHub Copilot coding agent | Isolated tasks, skills, review workflow | Versioned skills and review-before-merge |
| 22 | Replit Agent | Conversational build, test, and deploy | Guided implementation with visible milestones |
| 23 | Devin | Parallel sessions, playbooks, knowledge, session analysis | Reusable playbooks and post-task learning |
| 24 | Manus | Sandboxed autonomous work and persistent artifacts | Artifact-first completion in controlled environments |
| 25 | Mistral Agents API | Persistent state, connectors, handoffs, multi-agent | Provider-portable conversations and handoffs |

The machine-readable source URLs, strengths, and adoption decisions are in `aggy-agentic-benchmark.json`.

## Implemented candidate behavior

- `workers/aggy-agentic-policy.js` classifies each request into a bounded operating mode, risk level, and suggested QuX specialists.
- `workers/quhub-llm-gateway.js` injects the agentic policy server-side and records the policy version, mode, risk, and specialists in the response trace.
- High-risk requests cannot silently cross payment, purchase, deployment, publication, deletion, credential, security-policy, or external-message boundaries.
- Independent read-only work may be parallelized; mutations remain serialized and require verified postconditions.
- Voice retains the current Realtime architecture while adding consultative accompaniment, AI transparency, a Colombian Spanish identity, approval boundaries, and explicit preservation of QuFense, QuIdentify, QuOptio, QuAudit, QuVault, and E2EE/PQC.
- The current QuHub user-selected provider mode remains available. SQAILE orchestration remains the default and QuOptio is responsible for quality/cost/latency tradeoffs without weakening security.

## What was deliberately not implemented

- No attempt to expose private chain-of-thought.
- No claim that a QuX specialist executed without an actual tool trace.
- No autonomous payment, publication, deployment, deletion, credential change, policy change, or external message.
- No unbounded agent-to-agent loop.
- No cross-user memory and no secret storage in conversational memory.
- No replacement of Voice LIVE, secure chat, file controls, billing controls, or existing E2EE/PQC behavior.
- No production promotion in this change set.

## Acceptance gates before promotion

1. Full local regression passes.
2. Prompt-injection, approval-boundary, provider-failure, latency, and cost tests pass.
3. QuAudit confirms trace completeness and that specialist claims are evidence-bound.
4. QuFense verifies fail-closed behavior for tools and external content.
5. QuIdentify verifies per-agent and per-tool identities instead of a shared broad token.
6. A controlled staging run validates Voice LIVE turn-taking, interruption, session continuity, and Colombian voice quality with human listeners.
7. Eddie Velasquez Ortiz explicitly approves promotion.
