const viteEnv = import.meta as ImportMeta & {
	env?: {
		VITE_API_BASE_URL?: string;
		VITE_API_URL?: string;
	};
};

// At runtime, prefer an explicitly set VITE_API_BASE_URL, then VITE_API_URL.
// If neither is set (e.g. frontend was deployed without the env), fall back to:
// - On Render production: use known Render backend URL
// - Locally: use localhost
// - Fallback: use window.location.origin + '/api'
function getRuntimeDefault() {
	if (typeof window === "undefined" || !window.location) {
		return "http://localhost:5000/api";
	}
	
	const host = window.location.hostname;
	// If on Render frontend (peda-wala.onrender.com), use Render backend
	if (host.includes("peda-wala.onrender.com") || host.includes("onrender.com")) {
		return "https://pedhe-backend.onrender.com/api";
	}
	
	// Default: use current origin
	return `${window.location.origin}/api`;
}

const runtimeDefault = getRuntimeDefault();
const rawBase = viteEnv.env?.VITE_API_BASE_URL || viteEnv.env?.VITE_API_URL || runtimeDefault;

function normalizeApiBase(base: string) {
    if (!base) return base;
    let s = base.trim();
    // remove trailing slashes
    s = s.replace(/\/+$/g, "");
    // if it already ends with /api, keep it
    if (/\/api$/i.test(s)) return s;
    // otherwise append /api
    return s + "/api";
}

export const API_BASE_URL = normalizeApiBase(rawBase);

// Export image/static base URL separately for use in components
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");
