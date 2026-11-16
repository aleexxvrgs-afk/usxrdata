// Edge Function: recibe imagen base64, la sube a Supabase Storage
// Las credenciales vienen de variables de entorno, nunca del código
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const SUPA_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPA_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variables de entorno no configuradas' });
  }

  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64 || !fileName) {
      return res.status(400).json({ error: 'imageBase64 y fileName son requeridos' });
    }

    // Convertir base64 a buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Detectar tipo de imagen
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';

    // Nombre único para evitar colisiones
    const uniqueName = Date.now() + '-' + fileName.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase();

    // Subir a Supabase Storage bucket "products"
    const uploadRes = await fetch(`${SUPA_URL}/storage/v1/object/products/${uniqueName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'Error subiendo imagen: ' + err });
    }

    // Construir URL pública
    const publicUrl = `${SUPA_URL}/storage/v1/object/public/products/${uniqueName}`;
    res.status(200).json({ url: publicUrl });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
