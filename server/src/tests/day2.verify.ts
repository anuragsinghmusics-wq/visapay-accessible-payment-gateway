import { app } from "../app.js";
import {
  CreditCard,
  Transaction,
  PaymentMethodFactory,
  PaymentStrategyResolver,
  VisaNetStrategy,
} from "@visapay/shared";
import http from "http";

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path: string, options: { method: string; body?: unknown; token?: string }): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runVerifications() {
  console.log("==================================================");
  console.log(" [Gravitas Verification] Day 2 Acceptance Suite");
  console.log("==================================================");

  // 1. OOD Domain Model: CreditCard
  console.log("\n-> 1. Testing OOD CreditCard Domain Model...");
  const validCard = new CreditCard({
    cardNumber: "4242424242424242",
    expMonth: "12",
    expYear: "2028",
    cvv: "123",
    cardholderName: "Ada Lovelace",
  });

  assert(validCard.network === "visa", "Network should be visa");
  assert(validCard.last4 === "4242", "Last4 should be 4242");
  assert(validCard.getMaskedNumber() === "•••• •••• •••• 4242", "Masked format matches");
  assert(!validCard.isExpired(), "Card in 2028 should not be expired");
  assert(validCard.validate().isValid, "Card should pass Luhn and expiry validation");
  const token = validCard.tokenize();
  assert(token.startsWith("tok_visa_4242_"), `Token format should match: ${token}`);
  console.log("   ✓ CreditCard encapsulation, Luhn validation & tokenization passed.");

  // Test invalid Luhn
  const invalidLuhnCard = new CreditCard({
    cardNumber: "4242424242424243", // Invalid Luhn checksum
    expMonth: "12",
    expYear: "2028",
    cvv: "123",
    cardholderName: "Ada Lovelace",
  });
  assert(!invalidLuhnCard.validate().isValid, "Invalid Luhn card should fail validation");
  console.log("   ✓ Invalid Luhn checksum correctly rejected.");

  // 2. OOD Domain Model: Transaction State Machine
  console.log("\n-> 2. Testing OOD Transaction State Machine...");
  const txn = new Transaction({
    id: "txn_test_01",
    merchantId: "mer_test_01",
    amount: 99.50,
    currency: "USD",
    network: "visa",
    cardLast4: "4242",
    idempotencyKey: "idem_key_001",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
  });

  assert(txn.status === "PENDING", "Initial status should be PENDING");
  txn.approve("VISA_AUTH_123456", 120);
  assert(txn.status === "APPROVED", "Status should transition to APPROVED");
  assert(txn.isSettled(), "Approved transaction should be settled");

  // Verify illegal transition throws
  let threwIllegalTransition = false;
  try {
    txn.decline("Some reason");
  } catch {
    threwIllegalTransition = true;
  }
  assert(threwIllegalTransition, "Attempting to decline an already approved transaction must throw");

  txn.refund("Customer returned goods");
  assert(txn.status === "REFUNDED", "Approved transaction transitioned to REFUNDED");
  console.log("   ✓ Transaction state machine transitions and invariants passed.");

  // 3. Factory Pattern: PaymentMethodFactory
  console.log("\n-> 3. Testing PaymentMethodFactory...");
  const factoryCard = PaymentMethodFactory.create({
    type: "credit_card",
    cardDetails: {
      cardNumber: "5454545454545454",
      expMonth: "08",
      expYear: "2027",
      cvv: "456",
      cardholderName: "Grace Hopper",
    },
  });
  assert(factoryCard instanceof CreditCard, "Factory should instantiate CreditCard instance");
  assert((factoryCard as CreditCard).network === "mastercard", "Factory card network is mastercard");
  console.log("   ✓ PaymentMethodFactory polymorphic instantiation passed.");

  // 4. Strategy Pattern: PaymentStrategyResolver
  console.log("\n-> 4. Testing PaymentStrategy Pattern...");
  const strategy = PaymentStrategyResolver.resolve("visa");
  assert(strategy instanceof VisaNetStrategy, "Resolver should yield VisaNetStrategy for visa");
  const authResult = await strategy.process(txn, validCard);
  assert(authResult.isApproved, "Valid test card should be approved by VisaNetStrategy");
  assert(Boolean(authResult.authCode), "Auth code must be generated");

  // Test decline trigger card ending in 0002
  const declineCard = new CreditCard({
    cardNumber: "4000000000000002",
    expMonth: "12",
    expYear: "2029",
    cvv: "123",
    cardholderName: "Test Decline",
  });
  const declineResult = await strategy.process(txn, declineCard);
  assert(!declineResult.isApproved, "Card ending in 0002 must trigger simulated decline");
  console.log("   ✓ Strategy pattern execution and simulation triggers passed.");

  // 5. Backend Auth API Endpoints (Runtime HTTP Integration)
  console.log("\n-> 5. Testing Auth API Endpoints (HTTP Integration)...");

  // Test 5a: Login with seeded credentials
  const loginRes = await request("/api/v1/auth/login", {
    method: "POST",
    body: {
      email: "merchant@visapay.demo",
      password: "Password123",
    },
  });
  assert(loginRes.status === 200, `Login should return 200, got ${loginRes.status}`);
  assert(Boolean(loginRes.data.data.token), "Login response must contain JWT token");
  const authToken = loginRes.data.data.token;
  console.log("   ✓ POST /api/v1/auth/login authenticated seeded merchant & returned signed JWT.");

  // Test 5b: Login with invalid password
  const badLoginRes = await request("/api/v1/auth/login", {
    method: "POST",
    body: {
      email: "merchant@visapay.demo",
      password: "WrongPassword999",
    },
  });
  assert(badLoginRes.status === 401, `Invalid password must return 401, got ${badLoginRes.status}`);
  console.log("   ✓ POST /api/v1/auth/login rejected invalid password with 401.");

  // Test 5c: Protected route GET /api/v1/auth/me with valid token
  const meRes = await request("/api/v1/auth/me", {
    method: "GET",
    token: authToken,
  });
  assert(meRes.status === 200, `Protected route should return 200, got ${meRes.status}`);
  assert(meRes.data.data.merchant.email === "merchant@visapay.demo", "Profile email matches");
  console.log("   ✓ GET /api/v1/auth/me verified JWT and retrieved merchant profile.");

  // Test 5d: Protected route without token
  const unauthRes = await request("/api/v1/auth/me", {
    method: "GET",
  });
  assert(unauthRes.status === 401, `Unauthenticated request must return 401, got ${unauthRes.status}`);
  console.log("   ✓ GET /api/v1/auth/me rejected missing token with 401.");

  // Test 5e: Duplicate email registration rejection
  const dupRegisterRes = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Duplicate Store",
      email: "merchant@visapay.demo",
      password: "Password123",
    },
  });
  assert(dupRegisterRes.status === 409, `Duplicate email must return 409, got ${dupRegisterRes.status}`);
  console.log("   ✓ POST /api/v1/auth/register rejected duplicate email with 409.");

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
      await runVerifications();
      server.close();
    } catch (err) {
      console.error("\n❌ VERIFICATION FAILED:", err);
      console.log("\nVERDICT: FAIL");
      server.close();
      process.exitCode = 1;
    }
  }
});
