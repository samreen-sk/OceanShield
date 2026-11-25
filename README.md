
# OCEANSHIELD — Crowdsourced Ocean Hazard Reporting & Social Media Analytics

# System Architecture

<img width="1950" height="1770" alt="architecture-oceanshield" src="https://github.com/user-attachments/assets/cca3a6db-d712-4481-86a8-e994faa06218" />


# Project Objectives, Deliverables and Reflections

## Objective 1: Development of a Secure Coastal Incident Reporting Platform

**Objective:** To design and develop a web-based platform that enables citizens to report coastal incidents and allows administrators to monitor, manage, and verify submitted reports through a centralized system.

| Deliverable | Description | Reflection |
|---|---|---|
| **D1.1 – Citizen and Admin Interface** | Develop citizen and administrator interfaces with incident reporting, incident viewing, and administrative management features. | The interface provides a centralized reporting and management experience. It highlights the importance of accessibility, usability, and simple navigation for different user roles. |
| **D1.2 – Secure Authentication System** | Implement JWT-based registration, login, token refresh, and role-based access control (RBAC). | Authentication strengthens platform security by restricting unauthorized access and separating citizen and administrator permissions. |
| **D1.3 – Coastal Incident Reporting Module** | Develop incident submission forms supporting multimedia uploads, GPS coordinates, and incident descriptions. | Combining geographical information and multimedia evidence provides better context for reported incidents. However, the accuracy and reliability of submitted information require verification. |

---

## Objective 2: Development of an AI-Powered Incident Classification and Verification System

**Objective:** To develop an intelligent AI pipeline that analyses coastal incident reports using text, images, geographical information, and other available evidence to improve incident identification and verification.

| Deliverable | Description | Reflection |
|---|---|---|
| **D2.1 – Multimodal AI Classification** | Develop a Python-based FastAPI microservice integrating Natural Language Processing (NLP) and Computer Vision models to analyse incident descriptions and uploaded images. | Multimodal analysis provides a more comprehensive understanding of incidents than relying on a single data source. However, model performance depends on input quality and requires continuous evaluation. |
| **D2.2 – Proximity-Based Duplicate Detection** | Implement a mechanism to identify potentially duplicate reports by analysing geographical proximity and incident information. | Duplicate detection helps minimize repeated reports and unnecessary administrative workload. Combining location and incident context improves the identification of potentially repeated submissions. |
| **D2.3 – Multi-Signal Evidence Fusion** | Combine incident descriptions, uploaded images, GPS coordinates, and other available evidence to generate consolidated AI-assisted assessments. | Evidence fusion improves contextual understanding by considering multiple information sources. AI predictions should remain advisory and support human verification. |

---

## Objective 3: Development of Geospatial Intelligence and Incident Prioritization

**Objective:** To implement geospatial intelligence capabilities that visualize coastal incidents, identify geographical and temporal patterns, and prioritize incidents based on their severity and potential impact.

| Deliverable | Description | Reflection |
|---|---|---|
| **D3.1 – Geospatial Incident Mapping** | Implement MongoDB 2dsphere geospatial indexing and Leaflet-based interactive maps and heatmaps to visualize incident distribution and support nearby searches. | Geospatial visualization makes it easier to understand incident distribution and identify areas with higher concentrations of reported activity. Its effectiveness depends on accurate GPS coordinates. |
| **D3.2 – Spatiotemporal Clustering** | Develop an analytical mechanism to group incidents based on geographical proximity and occurrence times to identify potential patterns. | Combining spatial and temporal information helps identify recurring incidents and emerging patterns, providing more meaningful insights than analysing individual reports. |
| **D3.3 – Incident Priority and Severity Engine** | Develop a priority assessment mechanism to classify incidents into severity levels and identify high-priority and critical incidents. | Automated severity assessment helps administrators focus on potentially critical incidents. However, classifications require validation and should complement human decision-making. |

---

## Objective 4: Implementation of Automated Alerting, Administration and System Deployment

**Objective:** To develop a reliable backend infrastructure that supports asynchronous processing, incident notifications, administrative monitoring, audit logging, and deployment of the complete OceanShield platform.

| Deliverable | Description | Reflection |
|---|---|---|
| **D4.1 – Background Processing Pipeline** | Integrate Redis and BullMQ workers to asynchronously process AI classification, duplicate detection, evidence fusion, clustering, severity assessment, and alert dispatch. | Asynchronous processing improves application responsiveness by separating report submission from computationally intensive analysis. It also emphasizes the importance of reliable job handling and error recovery. |
| **D4.2 – Automated Alert and Notification System** | Implement automated notifications for high-priority and critical incidents, including read tracking and email-based alert dispatch. | Automated notifications help ensure important incidents receive timely attention. Reliable delivery and appropriate alert thresholds are essential to avoid missed alerts and notification overload. |
| **D4.3 – Administrative Dashboard and Audit Logging** | Develop administrative tools for incident verification, analytics, feedback, and immutable audit logging of administrative activities. | Centralized administration improves transparency and accountability. Audit logging provides traceability and helps administrators review important system activities. |
| **D4.4 – Containerized Deployment and Health Monitoring** | Deploy the Node.js API, Python FastAPI microservice, MongoDB, and Redis using Docker Compose, with configuration validation and health-check endpoints. | Containerization improves deployment consistency and simplifies service management. Health monitoring helps identify service failures, while further testing is necessary to evaluate scalability and production readiness. |

---

## Overall Project Objectives Summary

| Objective No. | Project Objective | Key Deliverables |
|---|---|---|
| **1** | Secure Coastal Incident Reporting Platform | Citizen/Admin Interface, JWT Authentication, Incident Reporting Module |
| **2** | AI-Powered Incident Classification and Verification | Multimodal AI Classification, Duplicate Detection, Evidence Fusion |
| **3** | Geospatial Intelligence and Incident Prioritization | Geospatial Mapping, Spatiotemporal Clustering, Severity Engine |
| **4** | Automated Alerting, Administration and Deployment | Background Processing, Notifications, Admin Dashboard, Audit Logging, Docker Deployment |

---

## Expected Project Impact

| Area | Expected Benefit |
|---|---|
| **Incident Reporting** | Enables citizens to report coastal incidents with multimedia and GPS-based evidence. |
| **AI-Based Analysis** | Automates incident classification and helps identify potentially duplicated reports. |
| **Geospatial Intelligence** | Visualizes incident distribution and identifies geographical and temporal patterns. |
| **Incident Prioritization** | Helps administrators identify high-priority and critical incidents. |
| **Automated Notifications** | Supports timely communication of critical incidents to relevant authorities and responders. |
| **Transparency and Accountability** | Maintains incident records and administrative audit logs. |
| **Scalability and Deployment** | Provides a modular, containerized architecture that can be extended with additional monitoring and AI capabilities. |

## Overall Vision

To establish an intelligent, AI-assisted coastal incident management ecosystem that connects citizens, administrators, and responders through automated incident reporting, multimodal AI analysis, geospatial intelligence, and priority-based alerting.
