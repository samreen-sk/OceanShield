
# OCEANSHIELD — Crowdsourced Ocean Hazard Reporting & Social Media Analytics

> **Technical Blueprint & Production-Grade REST API Specification (SIH25039)**  
> Built with Node.js, Express.js, MongoDB (Geospatial 2dsphere), Python FastAPI AI Microservice, and Docker.

---

## 1. System Architecture

```text
                  ┌──────────────────────────────────────────────┐
                  │          Citizen Web / Mobile Client         │
                  └──────────────────────┬───────────────────────┘
                                         │
                                       CORS
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Node.js / Express REST API          │
                  │   - Helmet, Multi-tier Rate Limiting, RBAC   │
                  │   - Standardized JSON responses, Error Mw    │
                  └──────┬───────────────┬───────────────┬───────┘
                         │               │               │
        Geospatial / Data│          REST │          Queue│
                         ▼               ▼               ▼
                  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                  │   MongoDB   │ │  Python AI  │ │    Redis    │
                  │  (2dsphere) │ │ Microservice│ │ (BullMQ /   │
                  │ - Reports   │ │ - Text NLP  │ │  Workers)   │
                  │ - Incidents │ │ - Vision CNN│ └─────────────┘
                  │ - Users     │ │ - Multimodal│
                  │ - Evidence  │ └─────────────┘
                  │ - Audit Log │
                  └─────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   Background Analysis Pipeline   │
        │  1. Multimodal AI Classification │
        │  2. Proximity Duplicate Detection│
        │  3. Multi-Signal Evidence Fusion │
        │  4. Spatiotemporal Clustering    │
        │  5. Priority Severity Engine     │
        │  6. High/Critical Alert Dispatch │
        └──────────────────────────────────┘
```

---

## 2. Project Directory Structure

```text
OcienShield/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js          # Hazard enums, Roles, Statuses, Audit actions
│   │   │   ├── cors.js               # Whitelisted CORS policy
│   │   │   ├── db.js                 # Mongoose connection & lifecycle events
│   │   │   └── env.js                # Environment validator with sensible fallbacks
│   │   ├── controllers/
│   │   │   ├── adminController.js    # Aggregated dashboard metrics & trends
│   │   │   ├── authController.js     # Citizen registration, login, JWT refresh
│   │   │   ├── feedbackController.js # Verification/correction feedback
│   │   │   ├── healthController.js   # Liveness & readiness probes
│   │   │   ├── incidentController.js # Incident query & admin status verification
│   │   │   ├── mapController.js      # Geospatial heatmap point generation
│   │   │   ├── notificationController.js # Alerts query & read tracking
│   │   │   └── reportController.js   # Report submission, nearby queries, details
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Bearer JWT verification
│   │   │   ├── errorMiddleware.js    # Global error interceptor (no leaks in prod)
│   │   │   ├── rateLimitMiddleware.js# Multi-tier endpoint rate limiters
│   │   │   ├── roleMiddleware.js     # RBAC (CITIZEN vs ADMIN)
│   │   │   └── uploadMiddleware.js   # Secure Multer file upload (JPEG/PNG/WEBP/MP4/WEBM)
│   │   ├── models/
│   │   │   ├── auditLogModel.js      # Immutable action audit log
│   │   │   ├── feedbackModel.js      # Ground-truth correction feedback
│   │   │   ├── incidentModel.js      # Clustered hazard incident (2dsphere)
│   │   │   ├── notificationModel.js  # Triage alerts
│   │   │   ├── reportModel.js        # Individual citizen hazard report (2dsphere)
│   │   │   ├── socialEvidenceModel.js# Supporting public social posts (2dsphere)
│   │   │   └── userModel.js          # User schema with bcrypt password hashing
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── feedbackRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   ├── incidentRoutes.js
│   │   │   ├── mapRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── services/
│   │   │   ├── aiService.js          # REST integration with Python microservice
│   │   │   ├── incidentService.js    # Spatiotemporal incident clustering & updates
│   │   │   ├── notificationService.js# High/critical severity alert dispatcher
│   │   │   └── socialEvidenceService.js # Permitted social evidence correlation
│   │   ├── utils/
│   │   │   ├── apiResponse.js        # Standardized { success, message, data }
│   │   │   ├── asyncHandler.js       # Express async route wrapper
│   │   │   ├── auditLogger.js        # Safe audit recording without secrets
│   │   │   ├── confidenceCalculator.js # Transparent explainable fusion formula
│   │   │   ├── duplicateDetector.js  # Distance, time & text similarity scoring
│   │   │   ├── generateToken.js      # JWT access & refresh token generators
│   │   │   ├── geoUtils.js           # Haversine distance & centroid calculations
│   │   │   ├── seedData.js           # Development database seeder
│   │   │   └── severityCalculator.js # Triage priority calculation
│   │   ├── jobs/
│   │   │   ├── aiProcessingJob.js    # Async report processing pipeline
│   │   │   ├── notificationJob.js    # Worker alert task
│   │   │   └── socialAnalyticsJob.js # Periodic social evidence ingestion
│   │   ├── validators/
│   │   │   ├── authValidator.js      # Register & login input validation
│   │   │   ├── incidentValidator.js  # Incident status & verification validation
│   │   │   └── reportValidator.js    # GPS coordinates & description bounds
│   │   ├── app.js                    # Express app middleware assembly
│   │   └── server.js                 # Server entry point & graceful shutdown
│   ├── tests/
│   │   └── api.test.js               # Jest & Supertest test suite
│   ├── uploads/                      # Local uploaded media storage
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── ai-service/
│   ├── app.py                        # FastAPI AI microservice
│   ├── requirements.txt              # FastAPI, uvicorn, scikit-learn
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 3. Supported Ocean Hazard Classes

1. `OIL_SPILL` (Petroleum, fuel leaks, tarballs, slick sheens)
2. `PLASTIC_POLLUTION` (Macro-plastics, ghost nets, marine debris)
3. `DEAD_MARINE_LIFE` (Cetacean strandings, fish kills, turtle strandings)
4. `FLOOD_HIGH_WATER` (Coastal storm surges, tidal inundation, seawater intrusion)
5. `CYCLONE_STORM` (Gale winds, high destructive sea swells, tropical storms)
6. `HARMFUL_ALGAL_BLOOM` (Red tides, toxic cyanobacterial scums)
7. `SHIP_INCIDENT` (Vessel collisions, groundings, capsizing)
8. `OTHER` (Unclassified coastal hazards)

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js >= 18.0.0
- MongoDB installed locally OR running via Docker (`docker run -d -p 27017:27017 --name mongo mongo:7.0`)
- Python 3.10+ (Optional if running AI service natively)

### Step 1: Clone & Configure Environment
```bash
cd backend
cp .env.example .env
npm install
```

### Step 2: Seed Development Database
Populates default Admin user, citizens, geocoded reports, and active incidents:
```bash
npm run seed
```

**Default Test Credentials:**
- **Admin**: `admin@oceanshield.gov` / `Admin@OceanShield2026`
- **Citizen**: `ramesh.fisher@example.com` / `Citizen@Pass123`

### Step 3: Run Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000`.

### Step 4: Run Test Suite
```bash
npm test
```

---

## 5. Docker Deployment

To launch the complete distributed stack (Node API + Python AI + MongoDB + Redis):

```bash
docker compose up --build -d
```

Check health:
```bash
curl http://localhost:5000/health
curl http://localhost:8000/health
```

---

## 6. Complete REST API Reference

All versioned endpoints are prefixed with `/api/v1`.

### 6.1 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Public | Register new Citizen account |
| `POST` | `/api/v1/auth/login` | None | Public | Sign in and retrieve JWT tokens |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Any | Get current authenticated profile |
| `POST` | `/api/v1/auth/refresh` | None | Public | Exchange refresh token for access token |
| `POST` | `/api/v1/auth/logout` | Bearer JWT | Any | Sign out confirmation |

#### Register Request Example
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Captain Anand",
  "email": "anand.mariner@example.com",
  "password": "SecurePassword123"
}
```

---

### 6.2 Reports (`/api/v1/reports`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/reports` | Bearer JWT | Citizen | Submit hazard report with text, GPS & media |
| `GET` | `/api/v1/reports` | Optional | Any | Filter reports (hazardType, status, page, limit) |
| `GET` | `/api/v1/reports/my` | Bearer JWT | Citizen | View logged-in user's reports |
| `GET` | `/api/v1/reports/nearby` | None | Public | Geospatial search (`lat`, `lng`, `radius`) |
| `GET` | `/api/v1/reports/:id` | Optional | Any | Detailed report document |
| `PATCH` | `/api/v1/reports/:id` | Bearer JWT | Owner/Admin | Update description or status |

#### Submit Report Example (Multipart Form)
```http
POST /api/v1/reports
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

description: "Heavy slick of dark fuel oil spreading near harbor channel."
hazardType: "OIL_SPILL"
latitude: 13.0475
longitude: 80.2824
locationAccuracy: 10
media: [Binary Image File]
```

---

### 6.3 Incidents (`/api/v1/incidents`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/incidents` | None | Public | List incidents (filter by hazard, severity, status) |
| `GET` | `/api/v1/incidents/:id` | None | Public | Incident details + linked reports |
| `GET` | `/api/v1/incidents/:id/reports` | None | Public | All reports contributing to an incident |
| `PATCH` | `/api/v1/incidents/:id/status` | Bearer JWT | **ADMIN** | Verify, reject, or adjust severity |

---

### 6.4 Public Map (`/api/v1/map`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/map/heatmap` | None | Public | Normalized points `[lat, lng, intensity]` for Leaflet |

---

### 6.5 Admin Dashboard (`/api/v1/admin`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/analytics` | Bearer JWT | **ADMIN** | Aggregated counts, severity breakdown, trends |

---

### 6.6 Feedback & Notifications

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/feedback` | Bearer JWT | Any | Submit verification/correction notes |
| `GET` | `/api/v1/notifications` | Bearer JWT | Any | Retrieve alert notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | Bearer JWT | Any | Mark notification as read |

---

## 7. Evidence Fusion & Explainable Confidence

The system fuses multimodal signals into a transparent, explainable confidence score without claiming scientific validation:

$$\text{Confidence} = w_1(\text{Image}) + w_2(\text{Text}) + w_3(\text{Spatial}) + w_4(\text{Temporal}) + w_5(\text{Source}) - w_6(\text{DuplicateRisk})$$

Contributing signal scores are stored directly on the report and incident records:
```json
{
  "confidence": 0.88,
  "confidenceSignals": {
    "text": 0.94,
    "image": 0.85,
    "spatialAgreement": 0.80,
    "temporalAgreement": 0.85,
    "sourceEvidence": 0.60,
    "duplicateRisk": 0.05
  }
}
```

---

## 8. Multi-Tier Rate Limiting Architecture

| Policy | Scope | Window | Max Requests | Key Generator |
|---|---|---|---|---|
| **Global API** | `/api/*` | 15 mins | 100 req | IP Address |
| **Authentication** | `/auth/login`, `/auth/register` | 15 mins | 10 attempts | IP Address |
| **Report Submission** | `POST /reports` | 1 hour | 15 reports | User ID (or IP) |
| **Map Heatmap** | `GET /map/heatmap` | 15 mins | 300 req | IP Address |
| **Feedback** | `POST /feedback` | 1 hour | 20 req | User ID |

---

## 9. Security & Ethics Principles

1. **AI as Decision Support**: AI predictions (`predictedHazard`, `aiConfidence`) are strictly advisory and never labeled as official confirmation. Final emergency response remains with authorized authorities.
2. **Citizen Privacy**: Public and map endpoints mask individual reporter emails and identities.
3. **No Blind Trust in Social Media**: Social media is treated strictly as unverified corroborating evidence.
4. **Resilient Architecture**: If the Python AI service or email server is unreachable, citizen reports remain safely stored with automated fallback heuristics without data loss.
=======
