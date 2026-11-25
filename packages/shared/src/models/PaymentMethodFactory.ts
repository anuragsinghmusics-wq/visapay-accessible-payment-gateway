import { PaymentMethod } from "./PaymentMethod.js";
import { CreditCard, CreditCardProps } from "./CreditCard.js";
import { UpiPayment, UpiPaymentProps } from "./UpiPayment.js";
import { NetBankingPayment, NetBankingPaymentProps } from "./NetBankingPayment.js";
import { WalletPayment, WalletPaymentProps } from "./WalletPayment.js";
import { EmiPayment, EmiPaymentProps } from "./EmiPayment.js";

export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "upi"
  | "netbanking"
  | "wallet"
  | "emi";

export interface CreateCardPaymentDTO {
  type: "credit_card" | "debit_card";
  cardDetails: CreditCardProps;
}

export interface CreateUpiPaymentDTO {
  type: "upi";
  upiDetails: UpiPaymentProps;
}

export interface CreateNetBankingPaymentDTO {
  type: "netbanking";
  netBankingDetails: NetBankingPaymentProps;
}

export interface CreateWalletPaymentDTO {
  type: "wallet";
  walletDetails: WalletPaymentProps;
}

export interface CreateEmiPaymentDTO {
  type: "emi";
  emiDetails: EmiPaymentProps;
}

export type CreatePaymentMethodDTO =
  | CreateCardPaymentDTO
  | CreateUpiPaymentDTO
  | CreateNetBankingPaymentDTO
  | CreateWalletPaymentDTO
  | CreateEmiPaymentDTO;

/**
 * Design Pattern: Factory Pattern
 * Encapsulates polymorphic instantiation logic across all supported payment rails.
 */
export class PaymentMethodFactory {
  public static create(dto: CreatePaymentMethodDTO): PaymentMethod {
    switch (dto.type) {
      case "credit_card":
      case "debit_card":
        return new CreditCard(dto.cardDetails);
      case "upi":
        return new UpiPayment(dto.upiDetails);
      case "netbanking":
        return new NetBankingPayment(dto.netBankingDetails);
      case "wallet":
        return new WalletPayment(dto.walletDetails);
      case "emi":
        return new EmiPayment(dto.emiDetails);
      default:
        throw new Error(`Unsupported payment method type: '${(dto as { type: string }).type}'`);
    }
  }
}
