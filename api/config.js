// Vercel Edge Function - expone variables de entorno al frontend de forma segura
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://usxrdata.vercel.app');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
  });
}
