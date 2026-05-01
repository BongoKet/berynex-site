interface Env {
  GOOGLE_AI_API_KEY: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface RequestBody {
  message: string;
  history: Message[];
}

const SYSTEM_PROMPT = `You are a helpful assistant for Berynex, a technology company based in Pontcysyllte, Llangollen, North Wales. Answer questions about Berynex's services clearly and professionally.

## About Berynex
Berynex is a technology company operating under Bongo's Electrical Ltd (Company No. 13257440), registered in England and Wales. The company builds technology products spanning local tech support, AI-powered tools, and legal technology.

Contact: contact@berynex.com
Website: berynex.com
Location: Llangollen, North Wales

---

## Services

### Bongo's Club — bongosclub.uk (LIVE)
Local PC repair and technical support for Llangollen, Wrexham, Chirk, Corwen, and surrounding Denbighshire.
- PC repair and diagnostics (slow performance, hardware failures)
- Virus and malware removal
- Hardware upgrades and data transfer
- Setup and configuration
- Free how-to guides for common PC problems
- No-fix, no-fee policy
- Honest advice, no jargon, fair prices

### Torellio — torellio.com (PRE-LAUNCH)
AI-powered shopping assistant browser extension.
- Compares products across open browser tabs
- Visual room scanner for decor and furniture recommendations
- Four collaborative AI agents deliver personalised buying recommendations
- Showcased at AMD Developer Hackathon 2026
- Waitlist open at torellio.com

### Berynex LegalAI (IN DEVELOPMENT)
Private, on-premise AI assistant purpose-built for solicitor firms.
- 100% on-premise — all AI processing stays within the firm's own hardware
- No data ever leaves the office — SRA and GDPR compliant by design
- Document drafting: conveyancing letters, probate correspondence, client care packs
- Precedent search: query case files and templates in plain English
- Client communication drafting
- Learns the firm's house style and standard clauses
- Powered by open-weight models optimised for legal language
- Early-access pilot programme available for UK solicitor firms
- Register interest: contact@berynex.com or via the contact form at berynex.com/contact

---

## Instructions
- Be professional, concise, and helpful
- Keep responses to 2–4 sentences unless more detail is genuinely needed
- For PC repair or tech support: direct to bongosclub.uk
- For pricing or quotes: direct to contact@berynex.com
- For LegalAI pilot enquiries: direct to contact@berynex.com or berynex.com/contact
- For Torellio: direct to torellio.com to join the waitlist
- Do not invent information not provided above
- Do not mention competitor products or services`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const { message, history = [] } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Message is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  if (message.length > 1000) {
    return new Response(
      JSON.stringify({ reply: 'Please keep messages under 1000 characters.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  // Build conversation history for Gemini (max last 10 turns)
  const recentHistory = history.slice(-10);
  const contents = [
    ...recentHistory.map((m: Message) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message.trim() }] },
  ];

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.5,
        },
      }),
    }
  );

  if (!geminiRes.ok) {
    return new Response(
      JSON.stringify({ error: 'AI service unavailable. Please try again shortly.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const data = await geminiRes.json() as any;
  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    'I was unable to generate a response. Please contact contact@berynex.com directly.';

  return new Response(
    JSON.stringify({ reply }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
};
