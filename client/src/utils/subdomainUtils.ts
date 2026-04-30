// Subdomain detection utilities
export const getSubdomainFromHost = (): string | null => {
  const host = window.location.hostname;
  
  // For localhost development: subdomain.localhost (e.g., admin.localhost, seller.localhost)
  if (host.includes("localhost")) {
    const parts = host.split(".");
    // Only return subdomain if it's a known dashboard subdomain
    if (parts.length > 1 && parts[0] !== "localhost") {
      const knownSubdomains = ["admin", "seller", "delivery", "subadmin"];
      if (knownSubdomains.includes(parts[0])) {
        return parts[0];
      }
    }
  }
  
  // For production: only detect true subdomains (admin.pedhe-wala.com, not pedhe-wala.vercel.app)
  // Vercel URLs: pedhe-wala.vercel.app (should NOT be treated as subdomain)
  // Render URLs: pedhe-backend.onrender.com (should NOT be treated as subdomain)
  // Custom domain: admin.pedhe-wala.com (SHOULD be treated as subdomain)
  
  // Skip if it's a known hosting domain
  if (host.includes(".vercel.app") || host.includes(".onrender.com") || host.includes(".netlify.app")) {
    return null;
  }
  
  // For custom domains, detect subdomains
  if (host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 2) {
      const knownSubdomains = ["admin", "seller", "delivery", "subadmin"];
      if (knownSubdomains.includes(parts[0])) {
        return parts[0]; // Return subdomain (e.g., "admin" from "admin.pedhe-wala.com")
      }
    }
  }
  
  return null;
};

export const buildSubdomainUrl = (subdomain: string, path: string = "/"): string => {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // For development (localhost)
  if (window.location.hostname.includes("localhost")) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}${path}`;
  }
  
  // For production
  const domain = window.location.hostname.split(".").slice(1).join(".");
  return `${protocol}//${subdomain}.${domain}${path}`;
};

export const isOnSubdomain = (): boolean => {
  return getSubdomainFromHost() !== null;
};

export const getCurrentSubdomain = (): string | null => {
  return getSubdomainFromHost();
};
