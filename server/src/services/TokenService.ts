import { CreditCard, CardNetwork } from "@visapay/shared";

export interface StoredToken {
  token: string;
  network: CardNetwork;
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName: string;
  createdAt: Date;
}

/**
 * Tokenization Vault Service
 * Simulates PCI-compliant token storage without storing raw PAN in primary tables.
 */
export class TokenService {
  private static tokenVault = new Map<string, StoredToken>();

  public static tokenizeCard(card: CreditCard): string {
    const token = card.tokenize();
    this.tokenVault.set(token, {
      token,
      network: card.network,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cardholderName: card.cardholderName,
      createdAt: new Date(),
    });
    return token;
  }

  public static resolveToken(token: string): StoredToken | null {
    // If found in vault
    if (this.tokenVault.has(token)) {
      return this.tokenVault.get(token)!;
    }

    // Fallback: parse well-formed mock tokens e.g. tok_visa_4242_xxx
    const parts = token.split("_");
    if (parts.length >= 4 && parts[0] === "tok") {
      const network = (parts[1] as CardNetwork) || "visa";
      const last4 = parts[2] || "4242";
      return {
        token,
        network,
        last4,
        expMonth: "12",
        expYear: "2028",
        cardholderName: "Cardholder",
        createdAt: new Date(),
      };
    }

    return null;
  }
}
