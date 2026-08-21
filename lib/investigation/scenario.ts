export type ScenarioKind =
  | "shipping-delay"
  | "lost-or-damaged-parcel"
  | "billing-dispute"
  | "deposit-dispute"
  | "airline-baggage"
  | "consumer-refund-dispute"
  | "contract-or-legal-document"
  | "general";

export interface ScenarioGuidance {
  kind: ScenarioKind;
  label: string;
  explanation: string;
  evidenceToGather: string[];
  suggestedActions: string[];
}

const RULES: { kind: ScenarioKind; label: string; patterns: RegExp[]; keywords: string[] }[] = [
  {
    kind: "airline-baggage",
    label: "Airline / airport baggage issue",
    patterns: [/\bairport\b/i, /\bairline\b/i, /\bchecked bag/i, /\b(lost|missing) (my )?(luggage|bag|baggage|suitcase)/i, /\bflight\b.*\b(lost|delay|damag)/i, /\bbaggage claim\b/i],
    keywords: ["airport", "airline", "flight", "luggage", "baggage", "suitcase", "checked bag", "boarding pass"]
  },
  {
    kind: "lost-or-damaged-parcel",
    label: "Lost, damaged, or missing parcel",
    patterns: [
      /\b(lost|missing) (my )?(package|parcel|order|delivery|shipment)/i,
      /\bnever (arrived|received|got|showed up)/i,
      /\b(says?|marked|shows?) (as )?delivered\b/i,
      /\bdidn'?t (receive|get)\b/i,
      /\bhaven'?t (received|got)\b/i,
      /\bdamaged (package|parcel|item|box)/i,
      /\b(package|parcel|item|box)\b[^.!?]*\bdamaged\b/i,
      /\bdamaged\b[^.!?]*\b(package|parcel|item|box)\b/i,
      /\bcrushed\b/i,
      /\bmissing (package|parcel|item)/i,
      /\bwrong item\b/i,
      /\bempty box\b/i,
      /\b(package|parcel|order|shipment)\b[^.!?]*\b(nahi|nai|ni)\s*(aya|aaya|ayi|pohnch|pahunch)/i,
      /\b(nahi|nai|ni)\s*(aya|aaya|ayi)\b[^.!?]*\b(package|parcel|order|shipment)/i
    ],
    keywords: ["parcel", "package", "delivered", "never received", "never arrived", "didn't receive", "haven't received", "damaged", "missing item", "amazon", "courier", "tracking", "nahi aya", "ni aya"]
  },
  {
    kind: "billing-dispute",
    label: "Incorrect or double billing",
    patterns: [
      /\bcharged (me )?twice\b/i,
      /\bdouble[- ]charged\b/i,
      /\bwrong (amount|charge)\b/i,
      /\bincorrect (charge|bill|billing)\b/i,
      /\bovercharged\b/i,
      /\bbilled (me )?for\b/i,
      /\bwon'?t reverse\b/i,
      /\bunauthorized (charge|transaction|payment)\b/i
    ],
    keywords: ["charged twice", "double charged", "wrong amount", "overcharged", "unauthorized charge"]
  },
  {
    kind: "deposit-dispute",
    label: "Security deposit not returned",
    patterns: [
      /\bsecurity deposit\b/i,
      /\blandlord\b[^.!?]*\b(deposit|refund|return)\b/i,
      /\bwon'?t return (my )?deposit\b/i,
      /\bdeposit\b[^.!?]*\b(landlord|withheld|keeping)\b/i
    ],
    keywords: ["security deposit", "landlord", "deposit not returned"]
  },
  {
    kind: "shipping-delay",
    label: "Shipping / delivery delay",
    patterns: [
      /\bdelayed\b/i,
      /\bstill (hasn'?t|has not) (arrived|shipped)/i,
      /\blate\b.*\b(delivery|shipment|parcel|order)/i,
      /\b(package|parcel|order|delivery|shipment|courier)\b[^.!?]*\blate\b/i,
      /\blate\b[^.!?]*\b(package|parcel|order|delivery|shipment|courier)\b/i,
      /\b\d+\s*days?\s*late\b/i,
      /\btaking (too )?long\b/i,
      /\bestimated delivery\b/i,
      /\btracking (has ?n'?t|has not) (updated|moved)/i,
      /\bhasn'?t (moved|updated) in\b/i,
      /\b\d+\s*din\s*se\b[^.!?]*\b(package|parcel|order|shipment)/i,
      /\b(package|parcel|order|shipment)\b[^.!?]*\b\d+\s*din\s*se\b/i
    ],
    keywords: ["days late", "delayed", "still hasn't arrived", "shipping delay", "taking too long", "estimated delivery", "tracking hasn't updated", "din se"]
  },
  {
    kind: "consumer-refund-dispute",
    label: "Refund / return / warranty dispute",
    patterns: [/\brefund\b/i, /\bchargeback\b/i, /\breturn (policy|window)\b/i, /\bwarranty\b/i, /\bdispute (the )?charge/i, /\bmoney back\b/i, /\barrived broken\b/i, /\brefuses? to refund\b/i],
    keywords: ["refund", "chargeback", "return policy", "warranty", "dispute charge", "money back"]
  },
  {
    kind: "contract-or-legal-document",
    label: "Contract, terms, or legal document review",
    patterns: [/\bterms (of service|and conditions)\b/i, /\bcontract\b/i, /\bclause\b/i, /\bagreement\b/i, /\bliability\b/i, /\bnda\b/i],
    keywords: ["terms of service", "contract", "clause", "agreement", "liability", "nda"]
  }
];

export function detectScenario(text: string): ScenarioKind {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.kind;
  }
  return "general";
}

export function getScenarioGuidance(kind: ScenarioKind): ScenarioGuidance {
  switch (kind) {
    case "airline-baggage":
      return {
        kind,
        label: "Airline / airport baggage issue",
        explanation:
          "Checked-baggage loss and delay on flights is governed by specific liability rules (the Montreal Convention on international flights, or the airline's own contract of carriage domestically), and airlines publish claim windows and compensation caps.",
        evidenceToGather: [
          "The airline's contract of carriage / baggage liability policy",
          "Your baggage claim (PIR) reference and the airline's stated claim deadline",
          "Boarding pass and baggage tag receipts as proof of travel",
          "Receipts for the contents, for a valuation claim",
          "Any travel insurance or credit card baggage-delay coverage terms",
        ],
        suggestedActions: [
          "File a Property Irregularity Report with the airline within their stated window if you haven't already",
          "Check whether your credit card or travel insurance includes baggage-delay reimbursement",
          "Request the airline's written baggage liability policy for your specific fare class and route",
        ],
      };
    case "lost-or-damaged-parcel":
      return {
        kind,
        label: "Lost, damaged, or missing parcel",
        explanation:
          "Responsibility for a lost or damaged parcel usually depends on three documents: the seller's shipping/return policy, the carrier's service guarantee, and (if you paid by card) your card issuer's purchase protection terms.",
        evidenceToGather: [
          "The seller's stated shipping and delivery guarantee",
          "The carrier's tracking history and their claims/liability policy",
          "Order confirmation and payment receipt",
          "Any delivery photo or proof-of-delivery the carrier provided",
          "Your card issuer's or PayPal's buyer/purchase protection terms",
        ],
        suggestedActions: [
          "Open a claim with the carrier using the tracking number",
          "Contact the seller citing their delivery guarantee before escalating",
          "If unresolved, file a chargeback or buyer-protection claim with your card issuer or payment provider",
        ],
      };
    case "billing-dispute":
      return {
        kind,
        label: "Incorrect or double billing",
        explanation:
          "For a wrong or duplicate charge, banks and card networks have a formal dispute process with a time limit — usually 60 to 120 days from the statement date depending on the card issuer and country. Acting quickly matters.",
        evidenceToGather: [
          "Your bank or card statement showing the charge(s) in question",
          "Any receipt or confirmation for what you actually agreed to pay",
          "Correspondence with the merchant, if you've already contacted them",
          "The merchant's billing or cancellation policy"
        ],
        suggestedActions: [
          "Contact the merchant first, in writing, and ask for a correction or refund",
          "If they don't resolve it, file a formal dispute with your bank or card issuer — most have an app or web form for this",
          "Keep records of every contact and date, since dispute windows are time-limited"
        ]
      };
    case "deposit-dispute":
      return {
        kind,
        label: "Security deposit not returned",
        explanation:
          "Most places have a legal deadline for landlords to return a deposit or provide an itemized list of deductions after move-out. Missing that deadline, or deducting for normal wear and tear, is often not allowed.",
        evidenceToGather: [
          "Move-in and move-out condition photos or a signed checklist",
          "Your lease agreement's deposit terms",
          "Any written notice of deductions the landlord provided",
          "Proof of your move-out date and forwarding address given to the landlord"
        ],
        suggestedActions: [
          "Request an itemized list of any deductions in writing if you haven't received one",
          "Check your local tenant law for the legal deadline and allowed deductions — this varies by location",
          "Small claims court is a realistic, low-cost option if the landlord doesn't respond"
        ]
      };
    case "shipping-delay":
      return {
        kind,
        label: "Shipping / delivery delay",
        explanation:
          "A delay claim is strongest when checked against what the seller actually promised (estimated delivery date at checkout) versus the carrier's real-time tracking events.",
        evidenceToGather: [
          "The delivery estimate shown at checkout or in the order confirmation email",
          "Live carrier tracking history, including any exception/delay scan events",
          "The seller's stated late-delivery policy (refund, replacement, or none)",
        ],
        suggestedActions: [
          "Compare the promised delivery date against the tracking timeline",
          "Ask the seller for their written late-delivery remedy before assuming there is none",
        ],
      };
    case "consumer-refund-dispute":
      return {
        kind,
        label: "Refund / return / warranty dispute",
        explanation:
          "Refund disputes hinge on the specific written policy in effect at time of purchase, not general expectations — policies vary by seller and can differ from platform-wide policies.",
        evidenceToGather: [
          "The seller's return/refund policy as it read at the time of purchase (check web.archive.org if it changed)",
          "Your order and payment records",
          "Any correspondence with the seller",
          "The platform's (e.g. marketplace) buyer-protection policy, separate from the seller's own policy",
        ],
        suggestedActions: [
          "Request the refund in writing citing the specific policy clause",
          "Escalate to the platform's buyer protection program if the seller doesn't respond",
          "As a last resort, dispute the charge with your card issuer",
        ],
      };
    case "contract-or-legal-document":
      return {
        kind,
        label: "Contract, terms, or legal document review",
        explanation:
          "For contract or terms review, the goal is to identify which specific clauses support or undercut a given claim, and to flag ambiguous or one-sided language rather than issue a legal opinion.",
        evidenceToGather: [
          "The full text of the specific clause(s) relevant to your question",
          "Any amendments, addenda, or referenced external policies",
          "The jurisdiction/governing-law clause, since rights vary by location",
        ],
        suggestedActions: [
          "Identify the exact clause number and quote the operative language before relying on it",
          "For anything with real financial or legal stakes, have a licensed attorney review before acting",
        ],
      };
    default:
      return {
        kind,
        label: "General claim",
        explanation: "No specific consumer/legal scenario pattern detected.",
        evidenceToGather: [],
        suggestedActions: [],
      };
  }
}
