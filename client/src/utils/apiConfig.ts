const viteEnv = import.meta as ImportMeta & {
	env?: {
		VITE_API_BASE_URL?: string;
		VITE_API_URL?: string;
	};
};

// At runtime, prefer an explicitly set VITE_API_BASE_URL, then VITE_API_URL.
// If neither is set (e.g. frontend was deployed without the env), fall back to a
// sensible runtime default: `window.location.origin + '/api'` when running in
// the browser, otherwise localhost for server-side tools.
const runtimeDefault = (typeof window !== "undefined" && window.location)
	? `${window.location.origin}/api`
	: "http://localhost:5000/api";

const rawBase = viteEnv.env?.VITE_API_BASE_URL || viteEnv.env?.VITE_API_URL || runtimeDefault;

function normalizeApiBase(base: string) {
	if (!base) return base;
	let s = base.trim();
	// remove trailing slashes
	s = s.replace(/\/+$"/g, "");
	// if it already ends with /api, keep it
	if (/\/api$/i.test(s)) return s;
	// otherwise append /api
	return s + "/api";
}

export const API_BASE_URL = normalizeApiBase(rawBase);
