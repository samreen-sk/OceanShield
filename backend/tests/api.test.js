const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/userModel");
const Report = require("../src/models/reportModel");
const Incident = require("../src/models/incidentModel");
const { calculateDistanceMeters, calculateCentroid } = require("../src/utils/geoUtils");
const { calculateConfidence } = require("../src/utils/confidenceCalculator");
const { calculateSeverity } = require("../src/utils/severityCalculator");
const { generateAccessToken } = require("../src/utils/generateToken");
const { ROLES, HAZARD_TYPES, SEVERITY_LEVELS } = require("../src/config/constants");

describe("OceanShield Backend Unit & API Test Suite", () => {
  // ==========================================
  // 1. Health & System Checks
  // ==========================================
  describe("Health & Readiness Checks", () => {
    it("GET /health should return standardized status JSON", async () => {
      const res = await request(app).get("/health");
      expect(res.body).toHaveProperty("success");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("status");
    });

    it("GET /non-existent-route should return 404 with errorResponse format", async () => {
      const res = await request(app).get("/api/v1/invalid-route-xyz");
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Resource not found");
    });
  });

  // ==========================================
  // 2. Geospatial & Mathematical Utilities
  // ==========================================
  describe("Geospatial & Fusion Utilities", () => {
    it("calculateDistanceMeters should calculate accurate distance between two coordinates", () => {
      // Chennai Marina Beach [80.2824, 13.0475] to Ennore Port [80.3241, 13.2201] (~19.6 km)
      const coord1 = [80.2824, 13.0475];
      const coord2 = [80.3241, 13.2201];
      const dist = calculateDistanceMeters(coord1, coord2);
      expect(dist).toBeGreaterThan(18000);
      expect(dist).toBeLessThan(22000);
    });

    it("calculateCentroid should correctly average geographic points", () => {
      const coords = [
        [80.0, 13.0],
        [80.2, 13.2]
      ];
      const centroid = calculateCentroid(coords);
      expect(centroid[0]).toBe(80.1);
      expect(centroid[1]).toBe(13.1);
    });

    it("calculateConfidence should return bounded explainable confidence and signals", () => {
      const result = calculateConfidence({
        text: 0.9,
        image: 0.85,
        spatialAgreement: 0.8,
        temporalAgreement: 0.75,
        sourceEvidence: 0.7,
        duplicateRisk: 0.1
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0.1);
      expect(result.confidence).toBeLessThanOrEqual(0.99);
      expect(result.signals).toHaveProperty("text");
      expect(result.signals).toHaveProperty("image");
      expect(result.signals).toHaveProperty("spatialAgreement");
      expect(result.signals).toHaveProperty("duplicateRisk");
    });

    it("calculateSeverity should compute high severity for dangerous hazards with corroboration", () => {
      const severity = calculateSeverity({
        hazardType: HAZARD_TYPES.CYCLONE_STORM,
        confidence: 0.9,
        sourceCount: 3,
        socialCount: 2
      });

      expect([SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.CRITICAL]).toContain(severity);
    });
  });

  // ==========================================
  // 3. Authentication & RBAC Middleware
  // ==========================================
  describe("Authentication & RBAC Enforcement", () => {
    it("Protected route without token should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("No authorization token provided");
    });

    it("Protected route with malformed token should return 401", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.token.value");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Citizen token attempting ADMIN endpoint should return 403 Forbidden", async () => {
      // Mock User.findById to return a Citizen user
      const findByIdSpy = jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Test Citizen",
          email: "citizen@example.com",
          role: ROLES.CITIZEN
        })
      });

      const citizenToken = generateAccessToken("507f1f77bcf86cd799439011", ROLES.CITIZEN);

      const res = await request(app)
        .get("/api/v1/admin/analytics")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Forbidden: Role 'CITIZEN' is not authorized");

      findByIdSpy.mockRestore();
    });
  });

  // ==========================================
  // 4. Report Input Validation
  // ==========================================
  describe("Report Input Validation", () => {
    it("Nearby search with invalid latitude should return 400 Bad Request", async () => {
      const res = await request(app).get("/api/v1/reports/nearby?lat=999&lng=80.27&radius=5000");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "lat" })])
      );
    });

    it("Nearby search with invalid longitude should return 400 Bad Request", async () => {
      const res = await request(app).get("/api/v1/reports/nearby?lat=13.08&lng=-999&radius=5000");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "lng" })])
      );
    });

    it("Nearby search with valid coordinates should return 200 with result payload", async () => {
      // Mock Report.find query chain
      const mockQueryChain = {
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: "507f1f77bcf86cd799439012",
            hazardType: HAZARD_TYPES.OIL_SPILL,
            description: "Sample nearby oil report",
            location: { type: "Point", coordinates: [80.27, 13.08] }
          }
        ])
      };
      const findSpy = jest.spyOn(Report, "find").mockReturnValue(mockQueryChain);

      const res = await request(app).get("/api/v1/reports/nearby?lat=13.08&lng=80.27&radius=5000");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("reports");
      expect(res.body.data.reports).toHaveLength(1);

      findSpy.mockRestore();
    });
  });

  // ==========================================
  // 5. Public Map Heatmap
  // ==========================================
  describe("Public Map Heatmap API", () => {
    it("GET /api/v1/map/heatmap should return heatmap point array", async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: "507f1f77bcf86cd799439013",
            centroid: { type: "Point", coordinates: [80.28, 13.04] },
            severity: SEVERITY_LEVELS.HIGH,
            hazardType: HAZARD_TYPES.OIL_SPILL,
            confidence: 0.9,
            sourceCount: 2
          }
        ])
      };
      const findSpy = jest.spyOn(Incident, "find").mockReturnValue(mockQueryChain);

      const res = await request(app).get("/api/v1/map/heatmap");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("points");
      expect(res.body.data.points).toHaveLength(1);
      expect(res.body.data.points[0]).toHaveProperty("lat", 13.04);
      expect(res.body.data.points[0]).toHaveProperty("lng", 80.28);
      expect(res.body.data.points[0]).toHaveProperty("intensity");

      findSpy.mockRestore();
    });
  });
});
