// Migración única: convertir precios de USDT a Soles en Supabase
// GET /api/migrate-prices?tc=3.95&secret=migrate2024
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { tc, secret } = req.query;
  if (secret !== 'migrate2024') return res.status(403).json({ error: 'Forbidden' });
  
  const TC = parseFloat(tc) || 3.95;
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    // Obtener todos los productos
    const r = await fetch(`${SUPA_URL}/rest/v1/products?select=id,plans`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
    });
    const products = await r.json();
    
    let updated = 0;
    for (const p of products) {
      const plans = Array.isArray(p.plans) ? p.plans : JSON.parse(p.plans || '[]');
      const newPlans = plans.map(function(pl) {
        const price = parseFloat(pl[1]) || 0;
        const before = parseFloat(pl[3]) || 0;
        // Si el precio parece USDT (menos de 100), multiplicar por TC
        const newPrice = price < 100 ? Math.round(price * TC * 100) / 100 : price;
        const newBefore = before > 0 && before < 100 ? Math.round(before * TC * 100) / 100 : before;
        const result = [pl[0], newPrice, pl[2]];
        if (newBefore > 0) result.push(newBefore);
        return result;
      });
      
      await fetch(`${SUPA_URL}/rest/v1/products?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': SUPA_KEY, 
          'Authorization': `Bearer ${SUPA_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ plans: newPlans })
      });
      updated++;
    }
    
    res.status(200).json({ ok: true, updated, tc: TC, message: `${updated} productos actualizados` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
