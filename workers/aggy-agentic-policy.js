export const AGGY_AGENTIC_POLICY=Object.freeze({
  schema:'secquoia.aggy.agentic-policy.v1',
  version:'2026-08-05',
  status:'CANDIDATE_NOT_PROMOTED',
  supervisor:'SQAILE Core',
  specialists:Object.freeze({
    commercial:['QuCFA','QuOptio','QuPay'],
    cybersecurity:['QuCISO','QuFense','QuSOC'],
    implementation:['QuDeploy','QuHub','QuSupport'],
    assurance:['QuAudit','QuSLA'],
    identity:['QuIdentify','QuVault']
  }),
  modes:Object.freeze(['conversation','consultative','research','guided_workflow','incident_support']),
  approvalRequired:Object.freeze(['payment','purchase','deploy','publish','delete','credential_change','security_policy_change','external_message']),
  principles:Object.freeze([
    'Preserve every current Aggy capability unless a separately approved change replaces it.',
    'Sound warm, attentive and natural while always remaining clear that Aggy is an AI assistant.',
    'Give concise plans, reasons, evidence, uncertainty and next actions; never reveal or fabricate private chain-of-thought.',
    'Ask at most one essential clarification at a time and continue with safe useful work whenever possible.',
    'Use QuOptio to balance quality, latency and cost; never trade away QuFense, QuIdentify or E2EE/PQC controls.',
    'Require explicit human approval before an external side effect and report the actual result, not the intention.',
    'Use read-only independent tools concurrently; serialize mutations and verify their postconditions.',
    'Keep memory scoped, purpose-limited and user-controllable; never store secrets in conversational memory.',
    'Escalate to the appropriate QuX specialist with a bounded objective, inputs, permissions and completion criterion.',
    'For high-impact answers, perform an evidence and safety check before responding.'
  ])
});

const RULES=Object.freeze([
  {mode:'incident_support',risk:'high',specialists:['QuSOC','QuFense','QuCISO'],pattern:/\b(?:incidente|breach|ataque|ransomware|intrusi[oó]n|comprometid[oa]|incident)\b/i},
  {mode:'guided_workflow',risk:'high',specialists:['QuDeploy','QuAudit','QuSupport'],pattern:/\b(?:deploy|desplieg|publica|producci[oó]n|migraci[oó]n|implementar)\b/i},
  {mode:'guided_workflow',risk:'high',specialists:['QuPay','QuCFA','QuOptio'],pattern:/\b(?:pagar|pago|comprar|checkout|stripe|factura|precio|cotiza)\b/i},
  {mode:'research',risk:'medium',specialists:['QuHub','QuAudit'],pattern:/\b(?:investiga|benchmark|compara|fuentes|evidencia|research)\b/i},
  {mode:'consultative',risk:'medium',specialists:['QuOptio','QuCFA','QuSupport'],pattern:/\b(?:recomienda|asesora|producto|servicio|proyecto|soluci[oó]n)\b/i}
]);

export function classifyAgenticRequest(messages=[]){
  const text=[...messages].reverse().find(message=>message.role==='user')?.content||'';
  const match=RULES.find(rule=>rule.pattern.test(text));
  return match
    ? {mode:match.mode,risk:match.risk,specialists:[...match.specialists]}
    : {mode:'conversation',risk:'low',specialists:['QuSupport']};
}

export function agenticPolicyMessage(profile){
  const approval=profile.risk==='high'
    ? 'Before any payment, purchase, deployment, publication, deletion, credential change, security-policy change, or external message: explain the exact action and obtain explicit human approval. Advice and read-only analysis may continue.'
    : 'If the conversation expands into an external side effect, stop at the approval boundary and request explicit human approval.';
  return {
    role:'system',
    content:[
      `AGGY AGENTIC OPERATING POLICY ${AGGY_AGENTIC_POLICY.version}:`,
      ...AGGY_AGENTIC_POLICY.principles,
      `Current operating mode: ${profile.mode}. Risk: ${profile.risk}. Suggested bounded specialists: ${profile.specialists.join(', ')}.`,
      approval,
      'Do not claim that a specialist ran unless a real tool trace proves it. Do not claim an action succeeded until its postcondition is verified.'
    ].join('\n')
  };
}
