// ================================================================
// WriteUp — src/lib/supabase.js
// Supabase client — shared across conversation engine and routes
// ================================================================

// ================================================================
// WriteUp — src/lib/supabase.js
// Supabase client — shared across conversation engine and routes
// ================================================================

const { createClient } = require("@supabase/supabase-js");
const { ProxyAgent, fetch: undiciFetch } = require("undici");

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set in .env");
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY is not set in .env");
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

const customFetch = dispatcher
  ? (url, options = {}) => undiciFetch(url, { ...options, dispatcher })
  : undiciFetch;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { global: { fetch: customFetch } }
);

module.exports = { supabase };
