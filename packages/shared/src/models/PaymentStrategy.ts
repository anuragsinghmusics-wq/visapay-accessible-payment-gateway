import { Transaction } from "./Transaction.js";
import { PaymentMethod } from "./PaymentMethod.js";
import { CreditCard } from "./CreditCard.js";
import { UpiPayment } from "./UpiPayment.js";
import { NetBankingPayment } from "./NetBankingPayment.js";
import { WalletPayment } from "./WalletPayment.js";
import { EmiPayment } from "./EmiPayment.js";
import { CardNetwork } from "../utils/luhnValidator.js";
import { PaymentRail } from "../types/payment.types.js";

export interface AuthorizationResult {
  isApproved: boolean;
  authCode?: string;
  declineReason?: string;
  network: string;
  latencyMs: number;
}

/**
 * Design Pattern: Strategy Pattern Interface
 * Defines interchangeable settlement algorithms across Card, UPI, NetBanking, Wallet, and EMI rails.
 */
export interface PaymentStrategy {
  readonly networkName: string;
  process(transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult>;
}

/**
 * Concrete Strategy: VisaNet Processing Engine
 */
export class VisaNetStrategy implements PaymentStrategy {
  public readonly networkName = "VisaNet Direct";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 60));

    if (paymentMethod instanceof CreditCard) {
      if (paymentMethod.last4 === "0002") {
        return {
          isApproved: false,
          declineReason: "Declined: Insufficient funds (VisaNet 05)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
      if (paymentMethod.last4 === "0004") {
        return {
          isApproved: false,
          declineReason: "Declined: Suspected Fraudulent Activity (VisaNet 59)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
    }

    return {
      isApproved: true,
      authCode: `VISA_AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
      network: this.networkName,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: Mastercard Global Clearing
 */
export class MastercardStrategy implements PaymentStrategy {
  public readonly networkName = "Mastercard Clearing Management";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 75));

    if (paymentMethod instanceof CreditCard) {
      if (paymentMethod.last4 === "0002") {
        return {
          isApproved: false,
          declineReason: "Declined: Insufficient funds (Mastercard 51)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
      if (paymentMethod.last4 === "0004") {
        return {
          isApproved: false,
          declineReason: "Declined: Fraud risk threshold exceeded (Mastercard 05)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
    }

    return {
      isApproved: true,
      authCode: `MC_AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
      network: this.networkName,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: Amex Settlement Engine
 */
export class AmexStrategy implements PaymentStrategy {
  public readonly networkName = "Amex Global Network";

  public async process(_transaction: Transaction, _paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 85));

    return {
      isApproved: true,
      authCode: `AMEX_AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
      network: this.networkName,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: UPI Instant Payment Rails (NPCI)
 */
export class UpiStrategy implements PaymentStrategy {
  public readonly networkName = "UPI Instant Rails";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 55));

    if (paymentMethod instanceof UpiPayment) {
      if (paymentMethod.vpa.startsWith("fail") || paymentMethod.vpa.startsWith("decline")) {
        return {
          isApproved: false,
          declineReason: "Declined: UPI collect request declined by user (U17)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
      if (paymentMethod.vpa.startsWith("fraud") || paymentMethod.vpa.startsWith("block")) {
        return {
          isApproved: false,
          declineReason: "Declined: VPA flagged for risk threshold (U28)",
          network: this.networkName,
          latencyMs: Date.now() - startTime,
        };
      }
    }

    return {
      isApproved: true,
      authCode: `UPI_REF_${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      network: this.networkName,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: NetBanking ACS Switch
 */
export class NetBankingStrategy implements PaymentStrategy {
  public readonly networkName = "NetBanking Clearing Switch";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 90));

    const bankTag = paymentMethod instanceof NetBankingPayment ? paymentMethod.bankCode : "BANK";
    return {
      isApproved: true,
      authCode: `NB_${bankTag}_${Math.floor(100000 + Math.random() * 900000)}`,
      network: `${bankTag} NetBanking`,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: Digital Wallet Token Gateway
 */
export class WalletStrategy implements PaymentStrategy {
  public readonly networkName = "Digital Wallet Express";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 45));

    const label = paymentMethod instanceof WalletPayment ? paymentMethod.provider.toUpperCase() : "WALLET";
    return {
      isApproved: true,
      authCode: `WAL_${label}_${Math.floor(100000 + Math.random() * 900000)}`,
      network: label.replace("_", " "),
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Concrete Strategy: FlexiCredit Installment / EMI Engine
 */
export class EmiStrategy implements PaymentStrategy {
  public readonly networkName = "VisaPay EMI Network";

  public async process(_transaction: Transaction, paymentMethod: PaymentMethod): Promise<AuthorizationResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 75));

    const tenure = paymentMethod instanceof EmiPayment ? paymentMethod.tenureMonths : 3;
    return {
      isApproved: true,
      authCode: `EMI_${tenure}M_${Math.floor(100000 + Math.random() * 900000)}`,
      network: `${tenure}-Month EMI Plan`,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Strategy Resolver: Context selector
 */
export class PaymentStrategyResolver {
  public static resolve(network: CardNetwork | PaymentRail): PaymentStrategy {
    switch (network) {
      case "upi":
        return new UpiStrategy();
      case "netbanking":
        return new NetBankingStrategy();
      case "wallet":
        return new WalletStrategy();
      case "emi":
        return new EmiStrategy();
      case "visa":
        return new VisaNetStrategy();
      case "mastercard":
        return new MastercardStrategy();
      case "amex":
        return new AmexStrategy();
      default:
        return new VisaNetStrategy();
    }
  }
}
