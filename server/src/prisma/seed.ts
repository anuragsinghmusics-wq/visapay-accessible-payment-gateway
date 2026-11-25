import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting VisaPay v2 database seed...");

  await prisma.webhookEvent.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.merchant.deleteMany();

  const passwordHash = await bcrypt.hash("Password123", 10);
  const webhookSecret = "whsec_visapay_hmac_secret_2026";

  const merchant = await prisma.merchant.create({
    data: {
      id: "mer_demo_1001",
      email: "merchant@visapay.demo",
      passwordHash,
      name: "Acme Cloud Commerce",
      apiKey: "vpy_live_test_apikey_2026",
      webhookUrl: "https://api.acmecommerce.io/webhooks/visapay",
      webhookSecret,
    },
  });

  console.log(`[Seed] Created Merchant: ${merchant.name} (${merchant.email})`);

  const now = new Date();
  const sampleTransactions = [
    {
      id: "txn_visa_90210a",
      merchantId: merchant.id,
      amount: 249.00,
      refundedAmount: 0,
      currency: "USD",
      status: "APPROVED",
      paymentRail: "card",
      network: "visa",
      cardLast4: "4242",
      authCode: "VISA_AUTH_902104",
      threeDsStatus: "AUTHENTICATED",
      riskScore: 14,
      idempotencyKey: "idem_demo_001_seed",
      customerName: "Alice Walker",
      customerEmail: "alice@acmecorp.io",
      latencyMs: 142,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 4),
    },
    {
      id: "txn_upi_83120b",
      merchantId: merchant.id,
      amount: 89.50,
      refundedAmount: 0,
      currency: "USD",
      status: "APPROVED",
      paymentRail: "upi",
      network: "upi",
      cardLast4: "OKHDFC",
      authCode: "UPI_REF_482910384712",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 9,
      idempotencyKey: "idem_demo_002_seed",
      customerName: "Rohan Verma",
      customerEmail: "rohan.v@fintech.in",
      latencyMs: 68,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 3),
    },
    {
      id: "txn_mc_38291c",
      merchantId: merchant.id,
      amount: 145.00,
      refundedAmount: 45.00,
      currency: "USD",
      status: "PARTIALLY_REFUNDED",
      paymentRail: "card",
      network: "mastercard",
      cardLast4: "5454",
      authCode: "MC_AUTH_382910",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 16,
      idempotencyKey: "idem_demo_003_seed",
      customerName: "Bob Martinez",
      customerEmail: "bob.m@studio.dev",
      failureReason: "Partial credit for seat adjustment",
      latencyMs: 185,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 2),
    },
    {
      id: "txn_visa_55002d",
      merchantId: merchant.id,
      amount: 320.00,
      refundedAmount: 0,
      currency: "USD",
      status: "DECLINED",
      paymentRail: "card",
      network: "visa",
      cardLast4: "0002",
      authCode: "N/A",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 28,
      idempotencyKey: "idem_demo_004_seed",
      customerName: "Charlie Brown",
      customerEmail: "charlie@example.com",
      failureReason: "Declined: Insufficient funds (VisaNet 05)",
      latencyMs: 210,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 1),
    },
    {
      id: "txn_nb_77192e",
      merchantId: merchant.id,
      amount: 499.00,
      refundedAmount: 0,
      currency: "USD",
      status: "APPROVED",
      paymentRail: "netbanking",
      network: "netbanking",
      cardLast4: "HDFC",
      authCode: "NB_HDFC_771920",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 11,
      idempotencyKey: "idem_demo_005_seed",
      customerName: "Priya Nair",
      customerEmail: "priya.nair@enterprise.co",
      latencyMs: 165,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: "txn_wal_99310f",
      merchantId: merchant.id,
      amount: 79.99,
      refundedAmount: 0,
      currency: "USD",
      status: "APPROVED",
      paymentRail: "wallet",
      network: "wallet",
      cardLast4: "APAY",
      authCode: "WAL_APPLE_PAY_993102",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 8,
      idempotencyKey: "idem_demo_006_seed",
      customerName: "Diana Prince",
      customerEmail: "diana@themyscira.org",
      latencyMs: 52,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: "txn_visa_11203g",
      merchantId: merchant.id,
      amount: 55.00,
      refundedAmount: 55.00,
      currency: "USD",
      status: "REFUNDED",
      paymentRail: "card",
      network: "visa",
      cardLast4: "4242",
      authCode: "VISA_AUTH_112030",
      threeDsStatus: "NOT_REQUIRED",
      riskScore: 12,
      idempotencyKey: "idem_demo_007_seed",
      customerName: "Evan Wright",
      customerEmail: "evan@example.com",
      failureReason: "Customer requested full cancellation",
      latencyMs: 130,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
  ];

  for (const txn of sampleTransactions) {
    await prisma.transaction.create({ data: txn });
  }

  // Seed shareable Payment Intents / Links
  const sampleIntents = [
    {
      id: "pi_cloud_pro_2026",
      merchantId: merchant.id,
      title: "Acme Cloud Enterprise Plan (Annual)",
      description: "Includes Dedicated PCI Vault, 99.99% SLA & Multi-Rail Access",
      amount: 249.0,
      currency: "USD",
      status: "REQUIRES_PAYMENT_METHOD",
      lineItemsJson: JSON.stringify([
        {
          id: "item_ent_1",
          name: "Acme Cloud Enterprise Plan",
          description: "Annual API Seat & Gateway Telemetry",
          quantity: 1,
          price: 249.0,
        },
      ]),
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: "pi_audit_retainer",
      merchantId: merchant.id,
      title: "WCAG 2.0 Accessibility Audit Retainer",
      description: "Automated Axe-Core CI integration & screen reader certification",
      amount: 79.0,
      currency: "USD",
      status: "REQUIRES_PAYMENT_METHOD",
      lineItemsJson: JSON.stringify([
        {
          id: "item_aud_1",
          name: "Accessibility Audit Package",
          description: "WCAG 2.0 AA + Section 508 Certification",
          quantity: 1,
          price: 79.0,
        },
      ]),
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const pi of sampleIntents) {
    await prisma.paymentIntent.create({ data: pi });
  }

  // Seed realistic signed Webhook Events
  const ts = Math.floor(now.getTime() / 1000);
  const webhookSeeds = [
    {
      id: "evt_seed_charge_ok",
      eventType: "charge.succeeded",
      transactionId: "txn_upi_83120b",
      data: { id: "txn_upi_83120b", amount: 89.5, currency: "USD", payment_rail: "upi", status: "APPROVED" },
    },
    {
      id: "evt_seed_refund_ok",
      eventType: "charge.refunded",
      transactionId: "txn_mc_38291c",
      data: { id: "txn_mc_38291c", refunded_amount: 45.0, currency: "USD", status: "PARTIALLY_REFUNDED" },
    },
  ];

  for (const ev of webhookSeeds) {
    const payloadJson = JSON.stringify(
      { id: ev.id, object: "event", api_version: "2026-11-01", created: ts, type: ev.eventType, data: { object: ev.data } },
      null,
      2
    );
    const sig = `t=${ts},v1=${createHmac("sha256", webhookSecret).update(`${ts}.${payloadJson}`).digest("hex")}`;
    await prisma.webhookEvent.create({
      data: {
        id: ev.id,
        merchantId: merchant.id,
        eventType: ev.eventType,
        transactionId: ev.transactionId,
        payloadJson,
        hmacSignature: sig,
        targetUrl: merchant.webhookUrl,
        statusCode: 200,
        deliveryStatus: "DELIVERED",
        attempts: 1,
        latencyMs: 36,
      },
    });
  }

  console.log("[Seed] VisaPay v2 seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
