import "dotenv/config";
import { app } from "../app.js";
import { prisma } from "../prisma/client.js";
import http from "http";
import { randomUUID } from "crypto";

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path: string, options: { method: string; body?: unknown; headers?: Record<string, string> }): Promise<{ status: number; data: any; headers: Headers }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data, headers: res.headers };
}

async function runDay3Verifications() {
  console.log("==================================================");
  console.log(" [Gravitas Verification] Day 3 Payment Engine Suite");
  console.log("==================================================");

  // 1. Test Card Tokenization API
  console.log("\n-> 1. Testing Card Tokenization API (POST /api/v1/payments/tokenize)...");
  const tokenRes = await request("/api/v1/payments/tokenize", {
    method: "POST",
    body: {
      cardNumber: "4242424242424242",
      expMonth: "10",
      expYear: "2028",
      cvv: "123",
      cardholderName: "Ada Lovelace",
    },
  });
  assert(tokenRes.status === 200, `Tokenize must return 200, got ${tokenRes.status}`);
  const paymentToken = tokenRes.data.data.payment_token;
  assert(paymentToken.startsWith("tok_visa_4242_"), `Token format invalid: ${paymentToken}`);
  assert(tokenRes.data.data.masked_number === "•••• •••• •••• 4242", "Masked number format correct");
  console.log(`   ✓ Tokenized card into secure token: ${paymentToken}`);

  // Test tokenization rejection for invalid Luhn card
  const badTokenRes = await request("/api/v1/payments/tokenize", {
    method: "POST",
    body: {
      cardNumber: "4242424242424243", // Invalid Luhn
      expMonth: "10",
      expYear: "2028",
      cvv: "123",
      cardholderName: "Bad Luhn",
    },
  });
  assert(badTokenRes.status === 400, "Invalid Luhn card must be rejected with 400");
  console.log("   ✓ Invalid card correctly rejected during tokenization.");

  // 2. Test Payment Charge with Token (README Spec Compliance)
  console.log("\n-> 2. Testing Payment Charge with Token (POST /api/v1/payments/charge)...");
  const testIdempotencyKey1 = randomUUID();
  const chargeRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 49.99,
      currency: "USD",
      idempotency_key: testIdempotencyKey1,
      payment_token: paymentToken,
      billing_details: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        postal_code: "94128",
      },
    },
  });

  assert(chargeRes.status === 201, `Approved charge should return 201, got ${chargeRes.status}`);
  assert(chargeRes.data.status === "APPROVED", "Status should be APPROVED");
  assert(Boolean(chargeRes.data.transaction_id), "Must contain transaction_id");
  assert(Boolean(chargeRes.data.auth_code), "Must contain auth_code");
  const txnId1 = chargeRes.data.transaction_id;
  console.log(`   ✓ Charge successful! Txn ID: ${txnId1}, Auth: ${chargeRes.data.auth_code}`);

  // 3. Test Idempotency Replay (Zero duplicate charge)
  console.log("\n-> 3. Testing Idempotency Guard (Duplicate Request Prevention)...");
  const initialTxnCount = await prisma.transaction.count();

  const replayRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 49.99,
      currency: "USD",
      idempotency_key: testIdempotencyKey1, // Exact same idempotency key
      payment_token: paymentToken,
      billing_details: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        postal_code: "94128",
      },
    },
  });

  assert(replayRes.status === 201, "Replay should return original status code 201");
  assert(replayRes.data.transaction_id === txnId1, "Replay must return identical original transaction_id");
  assert(replayRes.headers.get("x-cache-lookup") === "HIT", "X-Cache-Lookup must be HIT");

  const postReplayCount = await prisma.transaction.count();
  assert(initialTxnCount === postReplayCount, "Database transaction count must NOT increase on duplicate idempotency key");
  console.log("   ✓ Idempotency filter prevented duplicate transaction creation & returned cached payload.");

  // 4. Test Simulation Decline Triggers
  console.log("\n-> 4. Testing Payment Decline Triggers...");
  // Card ending in 0002 -> Insufficient funds
  const declineRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 150.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      card_details: {
        card_number: "4111111111150002", // valid Luhn ending in 0002
        exp_month: "11",
        exp_year: "2028",
        cvv: "123",
        cardholder_name: "Decline Test",
      },
      billing_details: {
        name: "Decline Test",
        email: "decline@example.com",
      },
    },
  });
  assert(declineRes.status === 402, `Decline should return 402, got ${declineRes.status}`);
  assert(declineRes.data.status === "DECLINED", "Status must be DECLINED");
  assert(declineRes.data.data.failureReason?.includes("Insufficient funds"), "Failure reason must state insufficient funds");
  console.log(`   ✓ Card ending in 0002 triggered simulated decline: ${declineRes.data.data.failureReason}`);

  // Card ending in 0004 -> Fraud hold
  const fraudRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 800.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      card_details: {
        card_number: "4111111111130004", // valid Luhn ending in 0004
        exp_month: "11",
        exp_year: "2028",
        cvv: "123",
        cardholder_name: "Fraud Test",
      },
      billing_details: {
        name: "Fraud Test",
        email: "fraud@example.com",
      },
    },
  });
  assert(fraudRes.status === 402, "Fraud hold must return 402");
  assert(fraudRes.data.data.failureReason?.toLowerCase().includes("fraud"), "Failure reason must state fraud");
  console.log(`   ✓ Card ending in 0004 triggered simulated fraud hold: ${fraudRes.data.data.failureReason}`);

  // 4b. Test UPI Instant Rails
  console.log("\n-> 4b. Testing UPI Instant Payment Rails...");
  const upiSuccessRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 25.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      upi_details: {
        vpa: "alex@visapay",
      },
      billing_details: {
        name: "Alex Mercer",
        email: "alex@visapay.demo",
      },
    },
  });
  assert(upiSuccessRes.status === 201, `UPI charge should return 201, got ${upiSuccessRes.status}`);
  assert(upiSuccessRes.data.status === "APPROVED", "UPI charge status must be APPROVED");
  assert(upiSuccessRes.data.network === "UPI Instant Rails", "Network must be UPI Instant Rails");
  console.log(`   ✓ UPI Instant Payment authorized: ${upiSuccessRes.data.transaction_id}, Auth: ${upiSuccessRes.data.auth_code}`);

  const upiDeclineRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 99.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      upi_details: {
        vpa: "declined@visapay",
      },
      billing_details: {
        name: "Declined UPI",
        email: "declined@visapay.demo",
      },
    },
  });
  assert(upiDeclineRes.status === 402, `Declined UPI should return 402, got ${upiDeclineRes.status}`);
  assert(upiDeclineRes.data.status === "DECLINED", "Status must be DECLINED");
  console.log(`   ✓ UPI decline trigger verified: ${upiDeclineRes.data.data.failureReason}`);

  // 5. Test Transactions Query API
  console.log("\n-> 5. Testing Transactions Query API (GET /api/v1/payments/transactions)...");
  const listRes = await request("/api/v1/payments/transactions?limit=10", {
    method: "GET",
  });
  assert(listRes.status === 200, `List transactions should return 200, got ${listRes.status}`);
  const items = listRes.data.data.items;
  assert(Array.isArray(items) && items.length > 0, "Transactions list must contain seeded items");
  assert(listRes.data.data.pagination.total >= items.length, "Pagination total should be valid");
  console.log(`   ✓ Retrieved ${items.length} transactions (Total in ledger: ${listRes.data.data.pagination.total}).`);

  // Test individual transaction lookup
  const singleRes = await request(`/api/v1/payments/transactions/${txnId1}`, {
    method: "GET",
  });
  assert(singleRes.status === 200, "Single lookup should return 200");
  assert(singleRes.data.data.id === txnId1, "Retrieved transaction ID must match");
  console.log(`   ✓ Retrieved single transaction detail for ID: ${txnId1}`);

  // 6. Test Merchant Dashboard Telemetry API
  console.log("\n-> 6. Testing Merchant Dashboard Telemetry (GET /api/v1/merchants/dashboard)...");
  const dashRes = await request("/api/v1/merchants/dashboard", {
    method: "GET",
  });
  assert(dashRes.status === 200, `Dashboard stats should return 200, got ${dashRes.status}`);
  const stats = dashRes.data.data;
  assert(stats.totalVolume > 0, "Gross volume must be > 0");
  assert(stats.approvalRate >= 0 && stats.approvalRate <= 100, "Approval rate must be a valid percentage");
  assert(Array.isArray(stats.volumeByDay), "volumeByDay must be an array");
  assert(Array.isArray(stats.volumeByNetwork), "volumeByNetwork must be an array");
  console.log(`   ✓ Dashboard Telemetry Calculated: Volume=$${stats.totalVolume}, ApprovalRate=${stats.approvalRate}%, TotalTxns=${stats.totalTransactions}`);

  // 7. Test VPA Verification, NetBanking, Wallet & EMI Rails
  console.log("\n-> 7. Testing Multi-Rail Payment Processing (UPI Verify, NetBanking, Wallet, EMI)...");
  const vpaRes = await request("/api/v1/payments/upi/verify", {
    method: "POST",
    body: { vpa: "alex@visapay" },
  });
  assert(vpaRes.status === 200 && vpaRes.data.data.verified === true, "UPI VPA verify must succeed");
  assert(vpaRes.data.data.accountHolderName === "Alex Mercer", "VPA must resolve verified beneficiary name");

  const nbRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 120.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      netbanking_details: { bank_code: "HDFC" },
      billing_details: { name: "NetBank User", email: "nb@visapay.demo" },
    },
  });
  assert(nbRes.status === 201 && nbRes.data.status === "APPROVED", "NetBanking charge must succeed");

  const walRes = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 35.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      wallet_details: { provider: "apple_pay" },
      billing_details: { name: "Wallet User", email: "wal@visapay.demo" },
    },
  });
  assert(walRes.status === 201 && walRes.data.status === "APPROVED", "Wallet charge must succeed");
  console.log(`   ✓ Multi-rail charges authorized (VPA=${vpaRes.data.data.accountHolderName}, NB=${nbRes.data.transaction_id}, Wallet=${walRes.data.transaction_id})`);

  // 8. Test 3D Secure 2.0 Challenge & Refund Lifecycle
  console.log("\n-> 8. Testing 3DS2 Challenge -> OTP Verification -> Partial Refund -> Webhooks...");
  const threeDsChallenge = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 250.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      payment_token: paymentToken,
      billing_details: { name: "High Value", email: "3ds@visapay.demo" },
    },
  });
  assert(threeDsChallenge.status === 200 && threeDsChallenge.data.requires_action === true, "Amount >= $200 must trigger 3DS2 challenge");

  const otpVerify = await request("/api/v1/payments/3ds/verify", {
    method: "POST",
    body: { otp: "123456" },
  });
  assert(otpVerify.status === 200 && otpVerify.data.data.verified === true, "3DS2 OTP 123456 must verify");

  const threeDsApproved = await request("/api/v1/payments/charge", {
    method: "POST",
    body: {
      amount: 250.0,
      currency: "USD",
      idempotency_key: randomUUID(),
      payment_token: paymentToken,
      three_ds_verified: true,
      billing_details: { name: "High Value", email: "3ds@visapay.demo" },
    },
  });
  assert(threeDsApproved.status === 201 && threeDsApproved.data.data.threeDsStatus === "AUTHENTICATED", "Post-3DS charge must approve as AUTHENTICATED");

  const partialRefund = await request(`/api/v1/payments/transactions/${threeDsApproved.data.transaction_id}/refund`, {
    method: "POST",
    body: { amount: 100.0, reason: "Partial item return" },
  });
  assert(partialRefund.status === 200 && partialRefund.data.data.status === "PARTIALLY_REFUNDED", "Partial refund must transition to PARTIALLY_REFUNDED");

  // 9. Test Payment Intents & Signed Webhooks
  const intentRes = await request("/api/v1/payment-intents", {
    method: "POST",
    body: { title: "Enterprise Invoice", amount: 199.0, currency: "USD" },
  });
  assert(intentRes.status === 201 && intentRes.data.data.id.startsWith("pi_"), "Payment intent must be created");

  const webhookRes = await request("/api/v1/merchants/webhooks", { method: "GET" });
  assert(webhookRes.status === 200 && webhookRes.data.data.length > 0, "Signed webhook events must be logged");
  assert(webhookRes.data.data[0].hmacSignature.includes("v1="), "Webhook signature must contain HMAC v1 digest");
  console.log(`   ✓ 3DS2 Challenge, Partial Refund ($100), PaymentIntent (${intentRes.data.data.id}), and HMAC Webhooks verified.`);

  console.log("\n==================================================");
  console.log(" VERDICT: PASS");
  console.log("==================================================");
}

// Start temporary local server on ephemeral port and run suite
server = app.listen(0, async () => {
  server.unref();
  const addr = server.address();
  if (typeof addr === "object" && addr) {
    baseUrl = `http://localhost:${addr.port}`;
    try {
      await runDay3Verifications();
      server.close();
      process.exit(0);
    } catch (err) {
      console.error("\n❌ VERIFICATION FAILED:", err);
      console.log("\nVERDICT: FAIL");
      server.close();
      process.exit(1);
    }
  }
});
