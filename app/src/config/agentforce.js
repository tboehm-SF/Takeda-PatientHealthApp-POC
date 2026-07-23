/**
 * Agentforce MIAW (Messaging for In-App and Web) configuration.
 *
 * These values come from the Embedded Service Deployment code snippet
 * generated in Salesforce Setup → Embedded Service Deployments.
 *
 * In production, override via environment variables (VITE_ prefix for Vite).
 */

const config = {
  orgId: import.meta.env.VITE_SF_ORG_ID || '00DHn000009hxPn',
  deploymentName:
    import.meta.env.VITE_SF_DEPLOYMENT_NAME || 'Zasocitinib_Patient_Support',
  siteURL:
    import.meta.env.VITE_SF_SITE_URL ||
    'https://storm-ffbfcc9fa2ad3e.my.site.com/ESWZasocitinibPatientSu1784554656094',
  // Direct SCRT2 URL — CORS is allowed by the Salesforce org's whitelist
  scrt2URL:
    import.meta.env.VITE_SF_SCRT2_URL ||
    'https://storm-ffbfcc9fa2ad3e.my.salesforce-scrt.com',
}

export default config
