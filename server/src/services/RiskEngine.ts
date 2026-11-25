export interface RiskEvaluationInput {
  amount: number;
  currency: string;
  paymentRail: string;
  cardLast4?: string;
  threeDsVerified?: boolean;
}

export interface RiskEvaluationResult {
  riskScore: number;
  threeDsRequired: boolean;
  threeDsStatus: "NOT_REQUIRED" | "CHALLENGED" | "AUTHENTICATED";
  reason: string;
}

const USD_EXCHANGE_APPROX: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.72,
  AUD: 0.65,
  JPY: 0.0066,
  INR: 0.012,
};

/**
 * Fraud & 3D Secure 2.0 Risk Evaluation Engine
 * Calculates real-time risk scores (0-100) and enforces risk-based 3DS2 OTP challenges.
 */
export class RiskEngine {
  public static evaluate(input: RiskEvaluationInput): RiskEvaluationResult {
    const rate = USD_EXCHANGE_APPROX[input.currency] || 1;
    const usdEquivalent = input.amount * rate;

    // Deterministic high-risk cards/VPAs proceed to Strategy so issuer fraud decline triggers cleanly
    if (input.cardLast4 === "0004") {
      return {
        riskScore: 89,
        threeDsRequired: false,
        threeDsStatus: "NOT_REQUIRED",
        reason: "High issuer velocity / risk flag",
      };
    }

    // 3DS2 trigger: Card rail with card ending in 3333 OR high-value checkout (>= $200 USD eq.)
    const isCardRail = input.paymentRail === "card";
    const triggersChallenge =
      isCardRail && (input.cardLast4 === "3333" || usdEquivalent >= 200);

    if (triggersChallenge && !input.threeDsVerified) {
      return {
        riskScore: 44,
        threeDsRequired: true,
        threeDsStatus: "CHALLENGED",
        reason: "3D Secure 2.0 SCA (Strong Customer Authentication) required",
      };
    }

    if (triggersChallenge && input.threeDsVerified) {
      return {
        riskScore: 14,
        threeDsRequired: false,
        threeDsStatus: "AUTHENTICATED",
        reason: "Authenticated via 3DS2 OTP verification",
      };
    }

    // Standard low-risk profile
    const baseScore = input.paymentRail === "upi" ? 9 : input.paymentRail === "wallet" ? 8 : 16;
    const amountFactor = Math.min(18, Math.floor(usdEquivalent / 30));

    return {
      riskScore: baseScore + amountFactor,
      threeDsRequired: false,
      threeDsStatus: "NOT_REQUIRED",
      reason: "Low-risk verified profile",
    };
  }
}
