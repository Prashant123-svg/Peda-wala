const viteEnv = import.meta as ImportMeta & {
	env?: {
		VITE_API_BASE_URL?: string;
		VITE_API_URL?: string;
	};
};

export const API_BASE_URL =
	viteEnv.env?.VITE_API_BASE_URL || viteEnv.env?.VITE_API_URL || "http://localhost:5000/api";
