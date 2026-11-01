// Vercel API - verifica el token de Cloudflare Turnstile server-side
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token
      })
    });

    const data = await resp.json();

    if (!data.success) {
      return res.status(403).json({ error: 'Verificación fallida', codes: data['error-codes'] });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno al verificar Turnstile' });
  }
}
