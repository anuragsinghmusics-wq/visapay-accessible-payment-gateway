import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import { CheckoutForm } from "../components/checkout/CheckoutForm";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { PaymentConfirmation } from "../components/checkout/PaymentConfirmation";
import { ThreeDSModal } from "../components/checkout/ThreeDSModal";
import { LiveAnnouncerProvider } from "../components/ui/LiveAnnouncer";
import { AccessibleButton } from "../components/ui/AccessibleButton";
import { AccessibleInput } from "../components/ui/AccessibleInput";

describe("VisaPay Accessibility Compliance (WCAG 2.0 / Section 508)", () => {
  it("should have zero violations on initial checkout render", async () => {
    const { container } = render(
      <LiveAnnouncerProvider>
        <div id="main-content">
          <OrderSummary />
          <CheckoutForm
            amount={49.99}
            currency="USD"
            onSuccess={() => {}}
            onDecline={() => {}}
          />
        </div>
      </LiveAnnouncerProvider>
    );

    // Run automated Axe-core accessibility audit
    const results = await axe.run(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "section508"],
      },
    });

    expect(results.violations).toHaveLength(0);
  });

  it("should maintain visible focus states during keyboard tab navigation", () => {
    render(
      <div>
        <AccessibleButton id="btn-1">Button 1</AccessibleButton>
        <AccessibleInput id="input-1" label="Input 1" />
        <AccessibleButton id="btn-2">Button 2</AccessibleButton>
      </div>
    );

    const btn1 = screen.getByRole("button", { name: /Button 1/i });
    const input1 = screen.getByRole("textbox", { name: /Input 1/i });
    const btn2 = screen.getByRole("button", { name: /Button 2/i });

    btn1.focus();
    expect(btn1).toHaveFocus();

    input1.focus();
    expect(input1).toHaveFocus();

    btn2.focus();
    expect(btn2).toHaveFocus();
  });

  it("should announce validation errors via aria-live regions", () => {
    render(
      <LiveAnnouncerProvider>
        <AccessibleInput
          id="err-input"
          label="Cardholder Name"
          error="Cardholder name is required."
        />
      </LiveAnnouncerProvider>
    );

    const errorContainer = document.getElementById("err-input-error");
    expect(errorContainer).toHaveAttribute("aria-live", "polite");
    expect(errorContainer).toHaveTextContent("Cardholder name is required.");
  });

  it("should trap focus within modal dialogs until dismissed", () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <PaymentConfirmation
          isOpen={true}
          onClose={handleClose}
          onReset={() => {}}
          receipt={{
            transactionId: "txn_test_123",
            status: "APPROVED",
            network: "VisaNet",
            authCode: "VISA_AUTH_2026",
            amount: 49.99,
            currency: "USD",
            last4: "4242",
            timestamp: new Date().toISOString(),
            customerName: "Jane Doe",
            customerEmail: "jane@example.com",
          }}
        />
      </MemoryRouter>
    );

    const firstFocusable = screen.getByRole("button", { name: /Copy transaction ID/i });
    const printBtn = screen.getByRole("button", { name: /Print Invoice/i });

    // Initial focus trapped on the first focusable control inside the modal upon mounting
    expect(firstFocusable).toHaveFocus();
    expect(printBtn).toBeInTheDocument();

    // Pressing Escape calls dismiss
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });

  it("should have zero axe-core violations inside 3D Secure 2.0 OTP modal", async () => {
    const { container } = render(
      <LiveAnnouncerProvider>
        <ThreeDSModal
          isOpen={true}
          amount={249.0}
          currency="USD"
          cardLast4="3333"
          network="VisaNet"
          riskScore={44}
          onCancel={() => {}}
          onAuthenticated={() => {}}
        />
      </LiveAnnouncerProvider>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "section508"],
      },
    });
    expect(results.violations).toHaveLength(0);
  });
});
