import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardInput } from "../components/checkout/CardInput";
import { UpiInput } from "../components/checkout/UpiInput";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { LiveAnnouncerProvider } from "../components/ui/LiveAnnouncer";

describe("VisaPay Checkout Usability & Field Interactions", () => {
  it("should auto-format card number into 4-digit groups as the user types", () => {
    const handleChange = vi.fn();

    const Wrapper = () => {
      const [val, setVal] = useState("");
      return (
        <LiveAnnouncerProvider>
          <CardInput
            value={val}
            onChange={(newVal, net, valid) => {
              setVal(newVal);
              handleChange(newVal, net, valid);
            }}
          />
        </LiveAnnouncerProvider>
      );
    };

    render(<Wrapper />);

    const cardInput = screen.getByRole("textbox", { name: /Card Number/i });

    // Change value with unformatted digits
    fireEvent.change(cardInput, { target: { value: "4242424242424242" } });

    expect(cardInput).toHaveValue("4242 4242 4242 4242");
    expect(screen.getByText("VISA")).toBeInTheDocument();
    expect(screen.getByText("Checksum Valid")).toBeInTheDocument();
  });

  it("should display Checksum Invalid badge when Luhn checksum fails", () => {
    const Wrapper = () => {
      const [val, setVal] = useState("");
      return (
        <LiveAnnouncerProvider>
          <CardInput
            value={val}
            onChange={(newVal) => setVal(newVal)}
          />
        </LiveAnnouncerProvider>
      );
    };

    render(<Wrapper />);

    const cardInput = screen.getByRole("textbox", { name: /Card Number/i });

    // 4242 4242 4242 4243 fails Luhn checksum
    fireEvent.change(cardInput, { target: { value: "4242424242424243" } });

    expect(screen.getByText("Invalid Checksum")).toBeInTheDocument();
  });

  it("should correctly calculate subtotal, shipping, and total in OrderSummary", () => {
    render(
      <OrderSummary
        items={[
          {
            id: "item-1",
            name: "License",
            description: "Gateway",
            quantity: 2,
            price: 25.0,
          },
        ]}
        shipping={0.0}
      />
    );

    expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("should render a real scannable UPI QR and validate VPA quick handles", async () => {
    const handleUpiChange = vi.fn();
    const Wrapper = () => {
      const [vpa, setVpa] = useState("");
      return (
        <LiveAnnouncerProvider>
          <UpiInput
            vpa={vpa}
            amount={49.99}
            currency="USD"
            onChange={(newVpa, valid) => {
              setVpa(newVpa);
              handleUpiChange(newVpa, valid);
            }}
          />
        </LiveAnnouncerProvider>
      );
    };

    render(<Wrapper />);

    // Default tab is Scan UPI QR and generates a real scannable QR data URI image
    const qrImage = await screen.findByRole("img", { name: /Scannable NPCI UPI QR code/i });
    expect(qrImage).toHaveAttribute("src", expect.stringContaining("data:image/png;base64,"));

    // Switch to Enter UPI ID / VPA tab
    fireEvent.click(screen.getByRole("tab", { name: /Enter UPI ID/i }));

    const vpaInput = screen.getByRole("textbox", { name: /Virtual Payment Address/i });
    fireEvent.change(vpaInput, { target: { value: "alex@visapay" } });
    expect(screen.getByText("Valid")).toBeInTheDocument();

    // Click quick handle button "@okhdfc"
    const hdfcBtn = screen.getByRole("button", { name: /@okhdfc/i });
    fireEvent.click(hdfcBtn);
    expect(vpaInput).toHaveValue("alex@okhdfc");
  });

  it("should apply VISAPAY20 promotional discount in OrderSummary", () => {
    const onAmountChange = vi.fn();
    render(
      <OrderSummary
        items={[
          {
            id: "item-1",
            name: "License",
            description: "Gateway",
            quantity: 1,
            price: 100.0,
          },
        ]}
        onAmountChange={onAmountChange}
      />
    );

    const promoInput = screen.getByRole("textbox", { name: /Enter promotional discount code/i });
    fireEvent.change(promoInput, { target: { value: "VISAPAY20" } });
    fireEvent.submit(promoInput.closest("form")!);

    expect(screen.getByText(/Promo VISAPAY20 applied/i)).toBeInTheDocument();
    expect(screen.getByText("-$20.00")).toBeInTheDocument();
    expect(onAmountChange).toHaveBeenCalledWith(80);
  });
});
