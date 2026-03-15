## 2026-02-22 - [Defense in Depth and Secure Failing]
**Vulnerability:** XSS Risks, Resource Exhaustion (DoS), and State Leakage in Logs.
**Learning:** In a static export environment (Next.js), many traditional server-side security controls (like HTTP headers) must be implemented via meta tags. Input validation should be performed at both the API and UI layers to ensure consistency. Error logging in services often accidentally exposes internal state if not explicitly sanitized.
**Prevention:** Implement CSP via Layout Metadata. Enforce character limits on all user-controlled text fields. Use specific error codes or generic messages in logs instead of full error objects.
