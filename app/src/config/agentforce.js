/**
 * Agentforce MIAW (Messaging for In-App and Web) configuration.
 *
 * These values come from the Embedded Service Deployment code snippet
 * generated in Salesforce Setup → Embedded Service Deployments.
 *
 * In production, override via environment variables (VITE_ prefix for Vite).
 */

// Use Netlify proxy in production to avoid CORS, direct URL in dev
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
const scrt2Direct = 'https://storm-ffbfcc9fa2ad3e.my.salesforce-scrt.com'

const config = {
  orgId: import.meta.env.VITE_SF_ORG_ID || '00DHn000009hxPn',
  deploymentName:
    import.meta.env.VITE_SF_DEPLOYMENT_NAME || 'Zasocitinib_Patient_Support',
  siteURL:
    import.meta.env.VITE_SF_SITE_URL ||
    'https://storm-ffbfcc9fa2ad3e.my.site.com/ESWZasocitinibPatientSu1784554656094',
  // Use proxy in production to avoid CORS; direct SCRT2 URL in dev
  scrt2URL:
    import.meta.env.VITE_SF_SCRT2_URL ||
    (isProduction ? '/api/scrt2' : scrt2Direct),
}

export default config
