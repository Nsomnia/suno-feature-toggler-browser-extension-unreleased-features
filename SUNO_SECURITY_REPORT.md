# Suno Security Findings Report
## For Responsible Disclosure to Suno AI Development Team

**Generated:** March 2026  
**Source:** API Sniffer Raw Data Analysis

---

## 🔴 CRITICAL FINDINGS

### 1. Overly Permissive CORS Configuration

**Severity:** HIGH  
**Location:** All `studio-api.prod.suno.com` endpoints

**Finding:**
All API endpoints return `access-control-allow-origin: *` which allows any website to make authenticated requests to the API.

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: accept,affiliate-id,anonymous-id,authorization,browser-token,content-type,date,device-id,referring-external-referrer,referring-origin,referring-pathname,referring-url-params,session-id,traceparent,tracestate,visitor-session-id,x-datadog-origin,x-datadog-parent-id,x-datadog-sampling-priority,x-datadog-trace-id,x-forwarded-for,x-forwarded-port,x-forwarded-proto,x-requested-with
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

**Risk:**
- Cross-site request forgery (CSRF) potential
- Malicious websites could make authenticated API calls using stolen tokens
- User data could be exfiltrated via crafted requests from attacker-controlled origins

**Recommendation:**
Restrict `Access-Control-Allow-Origin` to only `https://suno.com` and valid Suno domains.

---

### 2. Excessive Data Exposure in API Responses

**Severity:** MEDIUM  
**Location:** `/api/project/me`, `/api/clips/get_songs_by_ids`

**Finding:**
API responses include extensive user metadata that may be unnecessary:

```json
{
  "num_total_results": 39,
  "projects": [
    {
      "id": "default",
      "name": "My Workspace",
      "description": "Workspace for unassigned clips",
      "clip_count": 1874,
      "last_updated_clip": "2026-03-14T19:15:57.426Z",
      "shared": false
    }
  ]
}
```

**Risk:**
- Exposes user's creative work patterns and activity volume
- Project names may contain sensitive information
- Activity timestamps enable user behavior tracking

**Recommendation:**
Implement field-level data minimization - only return necessary fields.

---

### 3. Session ID Exposure in Response Headers

**Severity:** MEDIUM  
**Location:** All authenticated endpoints

**Finding:**
Session IDs are exposed in response headers:

```http
session-id: fbcdcc3d3ed955fda3a299dcf44f979d10b50280ed8c1ed6bd7b59e8962815ba
x-request-id: aO1o1jB0iYcEMiw=
```

**Risk:**
- Session IDs visible to any script on the page
- Could be captured by malicious browser extensions
- Enables session hijacking if intercepted

**Recommendation:**
- Use HttpOnly cookies for session management
- Remove session-id from response headers
- Consider using signed requests for sensitive operations

---

## 🟡 MODERATE FINDINGS

### 4. Client-Side Feature Gate Bypass

**Severity:** MEDIUM  
**Location:** Statsig SDK integration

**Finding:**
Feature gates (including premium features) are controlled entirely client-side via Statsig SDK. Gate values are received from `s.prod.suno.com/v1/initialize` and cached locally.

**Example:**
```json
{
  "gate": "agentic-simple",
  "gateValue": "false",
  "ruleID": "default",
  "reason": "Network:Recognized",
  "lcut": "1773504321648",
  "receivedAt": "1773520530511"
}
```

**Risk:**
- Users can override feature gates via browser extensions
- Premium feature restrictions can be bypassed
- A/B test manipulation possible

**Recommendation:**
- Validate feature entitlements server-side
- Do not rely solely on client-side gates for access control
- Implement server-side rate limiting for premium features

---

### 5. Analytics Endpoint No Authentication Required

**Severity:** LOW  
**Location:** `m-stratovibe.prod.suno.com/agg-receiver-service/v1/events/`

**Finding:**
The analytics/event tracking endpoints accept events without authentication:

```json
{
  "writeKey": "suno",
  "batch": [
    {
      "event": "Web-User-Event",
      "properties": {
        "actionName": "NavbarCreateButtonClicked",
        "userId": "6f1554f2-6c19-44cb-804c-8836ec9dbde5",
        "sessionId": "..."
      }
    }
  ]
}
```

**Risk:**
- Event injection/spoofing possible
- Analytics data pollution
- Potential for tracking user actions without consent

**Recommendation:**
- Implement authentication for analytics endpoints
- Validate event sources
- Rate limit per-device events

---

### 6. User ID Enumeration in Public Endpoints

**Severity:** LOW  
**Location:** `/api/profiles/{username}/info`

**Finding:**
Profile endpoints expose user IDs and metadata:

```json
{
  "instagram_link": "https://www.instagram.com/drek_vanee",
  "youtube_link": "https://YouTube.com/@DJDannySteel"
}
```

**Risk:**
- User enumeration possible
- Social media account linking exposed
- Privacy concerns for user profiles

**Recommendation:**
- Allow users to opt-out of public profile visibility
- Implement privacy controls for linked social accounts

---

## 🟢 INFORMATIONAL FINDINGS

### 7. Captcha Implementation Details Exposed

**Location:** `auth.suno.com/v1/client/verify`

The captcha verification process exposes implementation details:

```json
{
  "captcha_action": ["heartbeat"],
  "captcha_token": "0.-7GG659bS3BP4SiWZQh341LFBUf43xPh...",
  "captcha_widget_type": ["invisible"]
}
```

**Note:** Standard implementation, no immediate risk but should be monitored.

---

### 8. Model Version Information Leaked

**Location:** Multiple endpoints

Model versions are exposed in responses:

```json
{
  "model": "moderation-lyrics-v1",
  "uses_latest_model": true,
  "model_badges": {...}
}
```

**Note:** Low risk, but provides attackers insight into model architecture.

---

### 9. Timestamp-Based ID Generation

**Location:** All request IDs

Request IDs use predictable timestamp-based generation:

```json
{
  "id": "1773522954954-ln1cclx27",
  "timestamp": 1773522954754
}
```

**Note:** Not critical, but could enable request correlation attacks.

---

## 📋 SUMMARY TABLE

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Overly Permissive CORS | HIGH | 🔴 Needs Fix |
| 2 | Excessive Data Exposure | MEDIUM | 🟡 Review |
| 3 | Session ID in Headers | MEDIUM | 🟡 Review |
| 4 | Client-Side Gate Bypass | MEDIUM | 🟡 Review |
| 5 | Analytics No Auth | LOW | 🟢 Monitor |
| 6 | User ID Enumeration | LOW | 🟢 Monitor |
| 7 | Captcha Details | INFO | ⚪ Low Priority |
| 8 | Model Version Leak | INFO | ⚪ Low Priority |
| 9 | Timestamp IDs | INFO | ⚪ Low Priority |

---

## 🔧 IMMEDIATE ACTIONS RECOMMENDED

### Priority 1 (Critical - Fix Immediately)

1. **CORS Configuration**
   ```diff
   - Access-Control-Allow-Origin: *
   + Access-Control-Allow-Origin: https://suno.com
   ```

2. **Remove session-id from headers** - Use HttpOnly cookies instead

### Priority 2 (Important - Fix Within Sprint)

1. Implement server-side validation for all feature gates
2. Add authentication requirement for analytics endpoints
3. Implement field-level response filtering

### Priority 3 (Enhancement - Plan for Future)

1. Privacy controls for user profiles
2. Rate limiting per feature type
3. Request ID randomization

---

## 📧 CONTACT

This report should be submitted to the Suno AI security team via:
- Security email: security@suno.ai (if available)
- Bug bounty program (if applicable)
- Direct developer contact (as mentioned)

---

*This report is intended for responsible disclosure to improve platform security.*
