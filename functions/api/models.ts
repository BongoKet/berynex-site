interface Env { GOOGLE_AI_API_KEY: string; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_AI_API_KEY}`
  );
  const data = await res.json() as any;
  const names = (data.models ?? []).map((m: any) => m.name);
  return new Response(JSON.stringify(names, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
