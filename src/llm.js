// llm.js — provider registry for the coach's bring-your-own-key LLM calls.
//
// PURE functions only. Each adapter shapes the request (endpoint, headers, body) and
// parses the response for ONE provider. No fetch, no DOM, and crucially NO profile —
// adapters see only primitives ({ system, messages, model, maxTokens, key }). That
// keeps coach.callLLM the single place that touches the network, so the interior/
// faith scrub (profileSummary) and the crisis gate — both UPSTREAM in coach.js — can
// never be bypassed per-provider. `messages` use the app's internal shape:
// [{ role: 'user' | 'assistant', content }].

export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    host: 'api.anthropic.com',
    defaultModel: 'claude-opus-4-8',
    models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    howTo: { url: 'https://console.anthropic.com/settings/keys', steps: [
      'Sign in at console.anthropic.com',
      'Open Settings → API keys and create a key (starts with sk-ant-)',
      'Paste it here',
      'Add pay-as-you-go credit under Billing — a Claude Pro/Max subscription does NOT fund API calls',
    ] },
    endpoint: () => 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    buildBody: ({ model, system, messages, maxTokens }) => ({ model, max_tokens: maxTokens, system, messages }),
    parseResponse: (data) => ((data && data.content) || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim(),
  },

  openai: {
    id: 'openai',
    label: 'OpenAI (GPT)',
    host: 'api.openai.com',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o4-mini'],
    howTo: { url: 'https://platform.openai.com/api-keys', steps: [
      'Sign in at platform.openai.com',
      'Open API keys and create a secret key',
      'Paste it here',
      'Add credit under Settings → Billing',
    ] },
    endpoint: () => 'https://api.openai.com/v1/chat/completions',
    headers: (key) => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` }),
    // OpenAI takes the system prompt as a PREPENDED system-role message.
    buildBody: ({ model, system, messages, maxTokens }) => ({
      model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages],
    }),
    parseResponse: (data) => (((data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)) || '').trim(),
  },

  gemini: {
    id: 'gemini',
    label: 'Google (Gemini)',
    host: 'generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    howTo: { url: 'https://aistudio.google.com/apikey', steps: [
      'Sign in at aistudio.google.com',
      'Open "Get API key" and create one',
      'Paste it here',
    ] },
    // Key goes in the query string; model is in the path.
    endpoint: (model, key) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    headers: () => ({ 'content-type': 'application/json' }),
    // Gemini: SEPARATE systemInstruction, and roles are 'user'/'model' (NOT 'assistant').
    buildBody: ({ system, messages, maxTokens }) => ({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    parseResponse: (data) => ((data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || []).map((p) => p.text || '').join('').trim(),
  },

  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter (many models, one key)',
    host: 'openrouter.ai',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    models: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4o', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct'],
    howTo: { url: 'https://openrouter.ai/keys', steps: [
      'Sign in at openrouter.ai',
      'Open Keys and create one (a single key reaches hundreds of models)',
      'Paste it here',
      'Add credit under Credits',
    ] },
    endpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
    headers: (key) => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` }),
    buildBody: ({ model, system, messages, maxTokens }) => ({
      model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages],
    }),
    parseResponse: (data) => (((data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)) || '').trim(),
  },
};

export function providerFor(id) {
  return PROVIDERS[id] || PROVIDERS.anthropic;
}

export function defaultModelFor(id) {
  return providerFor(id).defaultModel;
}

// Hosts the service worker must NEVER cache (live API calls go straight to network).
// sw.js keeps its own literal copy (it can't import modules); a test guards against drift.
export const NO_CACHE_HOSTS = Object.values(PROVIDERS).map((p) => p.host).concat(['localhost', '127.0.0.1']);
