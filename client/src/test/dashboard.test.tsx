import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import axe from "axe-core";
import { StatsCards } from "../components/dashboard/StatsCards";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { TransactionTable, TransactionItem } from "../components/dashboard/TransactionTable";
import { LiveAnnouncerProvider } from "../components/ui/LiveAnnouncer";

vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

const mockTransactions: TransactionItem[] = [
  {
    id: "txn_demo_001",
    amount: 149.99,
    currency: "USD",
    status: "APPROVED",
    network: "VISA",
    last4: "4242",
    customerEmail: "alex@example.com",
    customerName: "Alex Mercer",
    createdAt: new Date().toISOString(),
  },
  {
    id: "txn_demo_002",
    amount: 75.50,
    currency: "USD",
    status: "DECLINED",
    network: "MASTERCARD",
    last4: "0002",
    customerEmail: "sarah@example.com",
    customerName: "Sarah Connor",
    createdAt: new Date().toISOString(),
  },
  {
    id: "txn_demo_003",
    amount: 220.00,
    currency: "USD",
    status: "REFUNDED",
    network: "AMEX",
    last4: "1005",
    customerEmail: "john@example.com",
    customerName: "John Wick",
    createdAt: new Date().toISOString(),
  },
];

const mockVolumeByDay = [
  { date: "2026-11-10", volume: 1500, count: 12 },
  { date: "2026-11-11", volume: 2400, count: 18 },
  { date: "2026-11-12", volume: 3100, count: 24 },
];

describe("VisaPay Merchant Dashboard & Analytics", () => {
  it("should render KPI summary cards with formatted metrics", () => {
    render(
      <StatsCards
        totalVolume={12500.50}
        totalTransactions={85}
        approvalRate={96.4}
        averageTicketSize={147.06}
        currency="USD"
      />
    );

    expect(screen.getByText("Total Gross Volume")).toBeInTheDocument();
    expect(screen.getByText("$12,500.50")).toBeInTheDocument();
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Network Approval Rate")).toBeInTheDocument();
    expect(screen.getByText("96.4%")).toBeInTheDocument();
    expect(screen.getByText("Average Ticket Size")).toBeInTheDocument();
    expect(screen.getByText("$147.06")).toBeInTheDocument();
  });

  it("should toggle between visual chart and accessible data table (WCAG 1.1.1)", () => {
    render(<RevenueChart data={mockVolumeByDay} currency="USD" />);

    // Default view: Shows toggle button for Accessible Table View
    const toggleBtn = screen.getByRole("button", { name: /Accessible Table View/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    // Click toggle to show accessible table
    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Gross Settlement Volume")).toBeInTheDocument();
    expect(screen.getByText("2026-11-10")).toBeInTheDocument();
    expect(screen.getByText("$1,500")).toBeInTheDocument();
    expect(screen.getByText("2026-11-11")).toBeInTheDocument();
    expect(screen.getByText("$2,400")).toBeInTheDocument();

    // Toggle back to visual chart
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("should filter transaction ledger by search term and status", () => {
    render(<TransactionTable transactions={mockTransactions} />);

    // Initial render shows all 3 rows
    expect(screen.getByText("Alex Mercer")).toBeInTheDocument();
    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("John Wick")).toBeInTheDocument();

    // Search for "Sarah"
    const searchInput = screen.getByRole("textbox", { name: /Filter transactions/i });
    fireEvent.change(searchInput, { target: { value: "Sarah" } });

    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.queryByText("Alex Mercer")).not.toBeInTheDocument();
    expect(screen.queryByText("John Wick")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Filter by status "Approved"
    const statusSelect = screen.getByRole("combobox", { name: /Filter by transaction status/i });
    fireEvent.change(statusSelect, { target: { value: "APPROVED" } });

    expect(screen.getByText("Alex Mercer")).toBeInTheDocument();
    expect(screen.queryByText("Sarah Connor")).not.toBeInTheDocument();
    expect(screen.queryByText("John Wick")).not.toBeInTheDocument();
  });

  it("should have zero axe-core accessibility violations on dashboard elements", async () => {
    const { container } = render(
      <LiveAnnouncerProvider>
        <div id="main-content" className="space-y-6">
          <StatsCards
            totalVolume={5000}
            totalTransactions={20}
            approvalRate={95.0}
            averageTicketSize={250}
          />
          <RevenueChart data={mockVolumeByDay} />
          <TransactionTable transactions={mockTransactions} />
        </div>
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

