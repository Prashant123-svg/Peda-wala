// Subdomain detection utilities
export const getSubdomainFromHost = (): string | null => {
  const host = window.location.hostname;
  
  // For localhost development: subdomain.localhost
  if (host.includes("localhost")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "localhost") {
      return parts[0]; // Return subdomain (e.g., "prashant" from "prashant.localhost")
    }
  }
  
  // For production: subdomain.example.com
  if (host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 2) {
      return parts[0]; // Return subdomain
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
