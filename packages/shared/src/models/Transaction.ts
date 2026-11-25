import { TransactionStatus, ThreeDsStatus } from "../types/transaction.types.js";
import { Currency, BillingDetails, PaymentRail } from "../types/payment.types.js";
import { CardNetwork } from "../utils/luhnValidator.js";

export interface TransactionProps {
  id: string;
  merchantId: string;
  amount: number;
  refundedAmount?: number;
  currency: Currency;
  status?: TransactionStatus;
  paymentRail?: string;
  network: CardNetwork | PaymentRail;
  cardLast4: string;
  authCode?: string;
  threeDsStatus?: ThreeDsStatus;
  riskScore?: number;
  idempotencyKey: string;
  customerName: string;
  customerEmail: string;
  billingDetails?: BillingDetails;
  failureReason?: string;
  latencyMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Domain Model: Transaction
 * Encapsulates state machine transitions (PENDING -> APPROVED / DECLINED -> REFUNDED / PARTIALLY_REFUNDED)
 */
export class Transaction {
  readonly #id: string;
  readonly #merchantId: string;
  readonly #amount: number;
  #refundedAmount: number;
  readonly #currency: Currency;
  #status: TransactionStatus;
  readonly #paymentRail: string;
  readonly #network: CardNetwork | PaymentRail;
  readonly #cardLast4: string;
  #authCode: string;
  #threeDsStatus: ThreeDsStatus;
  #riskScore: number;
  readonly #idempotencyKey: string;
  readonly #customerName: string;
  readonly #customerEmail: string;
  readonly #billingDetails?: BillingDetails;
  #failureReason?: string;
  #latencyMs?: number;
  readonly #createdAt: Date;
  #updatedAt: Date;

  constructor(props: TransactionProps) {
    if (props.amount <= 0) {
      throw new Error("Transaction amount must be strictly positive.");
    }
    this.#id = props.id;
    this.#merchantId = props.merchantId;
    this.#amount = props.amount;
    this.#refundedAmount = props.refundedAmount ?? 0;
    this.#currency = props.currency;
    this.#status = props.status || "PENDING";
    this.#paymentRail = props.paymentRail || "card";
    this.#network = props.network;
    this.#cardLast4 = props.cardLast4;
    this.#authCode = props.authCode || "";
    this.#threeDsStatus = props.threeDsStatus || "NOT_REQUIRED";
    this.#riskScore = props.riskScore ?? 12;
    this.#idempotencyKey = props.idempotencyKey;
    this.#customerName = props.customerName;
    this.#customerEmail = props.customerEmail;
    this.#billingDetails = props.billingDetails;
    this.#failureReason = props.failureReason;
    this.#latencyMs = props.latencyMs;
    this.#createdAt = props.createdAt || new Date();
    this.#updatedAt = props.updatedAt || new Date();
  }

  public get id(): string { return this.#id; }
  public get merchantId(): string { return this.#merchantId; }
  public get amount(): number { return this.#amount; }
  public get refundedAmount(): number { return this.#refundedAmount; }
  public get currency(): Currency { return this.#currency; }
  public get status(): TransactionStatus { return this.#status; }
  public get paymentRail(): string { return this.#paymentRail; }
  public get network(): CardNetwork | PaymentRail { return this.#network; }
  public get cardLast4(): string { return this.#cardLast4; }
  public get authCode(): string { return this.#authCode; }
  public get threeDsStatus(): ThreeDsStatus { return this.#threeDsStatus; }
  public get riskScore(): number { return this.#riskScore; }
  public get idempotencyKey(): string { return this.#idempotencyKey; }
  public get customerName(): string { return this.#customerName; }
  public get customerEmail(): string { return this.#customerEmail; }
  public get billingDetails(): BillingDetails | undefined { return this.#billingDetails; }
  public get failureReason(): string | undefined { return this.#failureReason; }
  public get latencyMs(): number | undefined { return this.#latencyMs; }
  public get createdAt(): Date { return this.#createdAt; }
  public get updatedAt(): Date { return this.#updatedAt; }

  public approve(authCode: string, latencyMs?: number): void {
    if (this.#status !== "PENDING") {
      throw new Error(`Illegal state transition: Cannot approve transaction with status '${this.#status}'`);
    }
    this.#status = "APPROVED";
    this.#authCode = authCode;
    this.#latencyMs = latencyMs;
    this.#updatedAt = new Date();
  }

  public decline(reason: string, latencyMs?: number): void {
    if (this.#status !== "PENDING") {
      throw new Error(`Illegal state transition: Cannot decline transaction with status '${this.#status}'`);
    }
    this.#status = "DECLINED";
    this.#failureReason = reason;
    this.#latencyMs = latencyMs;
    this.#updatedAt = new Date();
  }

  /**
   * Executes full or partial refund respecting remaining refundable balance.
   */
  public refund(reason?: string, refundAmount?: number): void {
    if (this.#status !== "APPROVED" && this.#status !== "PARTIALLY_REFUNDED") {
      throw new Error(
        `Illegal state transition: Can only refund an 'APPROVED' or 'PARTIALLY_REFUNDED' transaction, current is '${this.#status}'`
      );
    }
    const targetAmount = refundAmount ?? this.#amount - this.#refundedAmount;
    const remaining = Math.round((this.#amount - this.#refundedAmount) * 100) / 100;
    if (targetAmount <= 0 || targetAmount > remaining) {
      throw new Error(`Invalid refund amount: requested ${targetAmount}, remaining refundable is ${remaining}`);
    }
    this.#refundedAmount = Math.round((this.#refundedAmount + targetAmount) * 100) / 100;
    this.#status = this.#refundedAmount >= this.#amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
    this.#failureReason = reason || "Refund requested by merchant";
    this.#updatedAt = new Date();
  }

  public fail(reason: string): void {
    if (this.#status !== "PENDING") {
      throw new Error(`Illegal state transition: Cannot fail transaction with status '${this.#status}'`);
    }
    this.#status = "FAILED";
    this.#failureReason = reason;
    this.#updatedAt = new Date();
  }

  public isSettled(): boolean {
    return (
      this.#status === "APPROVED" ||
      this.#status === "REFUNDED" ||
      this.#status === "PARTIALLY_REFUNDED"
    );
  }

  public toJSON() {
    return {
      id: this.#id,
      merchantId: this.#merchantId,
      amount: this.#amount,
      refundedAmount: this.#refundedAmount,
      currency: this.#currency,
      status: this.#status,
      paymentRail: this.#paymentRail,
      network: this.#network,
      cardLast4: this.#cardLast4,
      authCode: this.#authCode,
      threeDsStatus: this.#threeDsStatus,
      riskScore: this.#riskScore,
      idempotencyKey: this.#idempotencyKey,
      customerName: this.#customerName,
      customerEmail: this.#customerEmail,
      billingDetails: this.#billingDetails,
      failureReason: this.#failureReason,
      latencyMs: this.#latencyMs,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
    };
  }
}
