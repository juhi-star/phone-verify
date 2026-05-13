const request = require("supertest");
const app = require("../src/app");
const { storage } = require("../src/services/storageService");

beforeEach(async () => {
  const users = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(storage), "constructor"
  );
});

describe("Health Check", () => {
  test("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Server is running");
  });
});

describe("Auth Routes", () => {
  const testUser = { name: "Test User", email: "test@jest.com", password: "password123" };
  let token;

  test("POST /api/auth/register - creates user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  test("POST /api/auth/register - rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/auth/register - validates required fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad" });
    expect(res.status).toBe(422);
  });

  test("POST /api/auth/login - logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test("POST /api/auth/login - rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/auth/login - rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me - returns user with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  test("GET /api/auth/me - rejects missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me - rejects invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
  });
});

describe("OTP Verification", () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "OTP User", email: "otp@jest.com", password: "password123" });
    token = res.body.data.token;
  });

  test("POST /api/verify/send-otp - sends OTP", async () => {
    const res = await request(app)
      .post("/api/verify/send-otp")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "+14155552671" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expiresAt).toBeDefined();
  });

  test("POST /api/verify/send-otp - rejects invalid phone", async () => {
    const res = await request(app)
      .post("/api/verify/send-otp")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "invalid" });
    expect(res.status).toBe(422);
  });

  test("POST /api/verify/send-otp - requires auth", async () => {
    const res = await request(app)
      .post("/api/verify/send-otp")
      .send({ phone: "+14155552671" });
    expect(res.status).toBe(401);
  });

  test("POST /api/verify/verify-otp - rejects wrong OTP", async () => {
    const res = await request(app)
      .post("/api/verify/verify-otp")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "+14155552671", otp: "000000" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/verify/status - returns verification status", async () => {
    const res = await request(app)
      .get("/api/verify/status")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isPhoneVerified).toBe(false);
  });

  test("POST /api/verify/verify-otp - validates OTP format", async () => {
    const res = await request(app)
      .post("/api/verify/verify-otp")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "+14155552671", otp: "abc" });
    expect(res.status).toBe(422);
  });
});

describe("404 Handling", () => {
  test("GET /api/nonexistent returns 404", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});
