import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import './config/axiosConfig.ts' // ✅ Setup axios interceptors
import { API_BASE_URL } from './utils/apiConfig';

const LOCAL_API_ORIGIN = "http://localhost:5000";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const rewriteLegacyUrl = (url: string): string => {
  if (!url.startsWith(LOCAL_API_ORIGIN)) return url;
  if (url.startsWith(`${LOCAL_API_ORIGIN}/api`)) {
    return url.replace(`${LOCAL_API_ORIGIN}/api`, API_BASE_URL);
  }
  return url.replace(LOCAL_API_ORIGIN, API_ORIGIN);
};

// Patch fetch so old hardcoded localhost requests also work in production.
const nativeFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string") {
    return nativeFetch(rewriteLegacyUrl(input), init);
  }
  if (input instanceof URL) {
    return nativeFetch(new URL(rewriteLegacyUrl(input.toString())), init);
  }
  if (input instanceof Request) {
    const rewritten = rewriteLegacyUrl(input.url);
    if (rewritten !== input.url) {
      return nativeFetch(new Request(rewritten, input), init);
    }
  }
  return nativeFetch(input, init);
}) as typeof window.fetch;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
