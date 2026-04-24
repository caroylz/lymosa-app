/**
 * LYMOSA ENERGY — Servidor backend
 * 
 * Qué hace este archivo:
 *  1. Sirve la app (index.html) al celular del despachador
 *  2. Recibe los datos + fotos cuando el despachador toca "Enviar"
 *  3. Llama al script Python para generar el PDF de 2 páginas
 *  4. Manda el PDF por correo al supervisor
 * 
 * Instalación (una sola vez):
 *   npm install express nodemailer multer
 * 
 * Arrancar:
 *   node server.js
 */

const express    = require('express');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
const fs         = require('fs');
const path       = require('path');
const os         = require('os');

const app  = express();
app.use(express.json({ limit: '50mb' }));  // fotos en base64 son grandes
app.use(express.static(__dirname));         // sirve index.html

// ══════════════════════════════════════════════════════════════
//  ⚙️  CONFIGURACIÓN — CAMBIA ESTOS VALORES
// ══════════════════════════════════════════════════════════════
const CONFIG = {
  // Tu correo de Gmail (donde se envían los reportes)
  email_destino: process.env.EMAIL_DESTINO,

  // Correo desde el que se envía (puede ser el mismo)
  email_origen: process.env.EMAIL_ORIGEN,

  // Contraseña de aplicación de Gmail
  // (No es tu contraseña normal — ve a: Google → Seguridad → Contraseñas de app)
  email_password: process.env.EMAIL_PASSWORD,

  // Puerto donde corre el servidor
  puerto: 3000,
};
// ══════════════════════════════════════════════════════════════

// ── RUTA PRINCIPAL: recibir reporte ────────────────────────────────────────
app.post('/api/reporte', async (req, res) => {
  const { estacion, embarque1, embarque2, fecha } = req.body;

  // Validación básica
  if (!embarque1?.numero || !embarque2?.numero) {
    return res.status(400).json({ error: 'Faltan datos de embarque' });
  }

  // Carpeta temporal para guardar las fotos e imágenes
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lymosa-'));

  try {
    // 1. Guardar las 4 fotos (vienen en base64 desde la app)
    const rutas = {};
    for (const [emb, datos] of [['embarque1', embarque1], ['embarque2', embarque2]]) {
      for (const num of [1, 2]) {
        const key    = `foto${num}`;
        const base64 = datos[key];
        if (base64) {
          const ext    = base64.includes('image/png') ? 'png' : 'jpg';
          const ruta   = path.join(tmpDir, `${emb}_foto${num}.${ext}`);
          const data   = base64.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(ruta, Buffer.from(data, 'base64'));
          rutas[`${emb}_foto${num}`] = ruta;
        }
      }
    }

    // 2. Crear el archivo de datos para el script Python
    const datosParaPython = {
      embarque1: {
        numero_embarque: embarque1.numero,
        producto:        embarque1.producto,
        estacion:        estacion,
        fecha_dia:       fecha.dia,
        fecha_mes:       fecha.mes,
        fecha_anio:      fecha.anio,
        foto1: rutas['embarque1_foto1'] || null,
        foto2: rutas['embarque1_foto2'] || null,
      },
      embarque2: {
        numero_embarque: embarque2.numero,
        producto:        embarque2.producto,
        estacion:        estacion,
        fecha_dia:       fecha.dia,
        fecha_mes:       fecha.mes,
        fecha_anio:      fecha.anio,
        foto1: rutas['embarque2_foto1'] || null,
        foto2: rutas['embarque2_foto2'] || null,
      }
    };

    const jsonPath = path.join(tmpDir, 'datos.json');
    fs.writeFileSync(jsonPath, JSON.stringify(datosParaPython));

    // 3. Llamar al script Python que genera el PDF
    const pdfPath   = path.join(tmpDir, 'reporte.pdf');
    const pyScript  = path.join(__dirname, 'generar_reporte_lymosa.py');
    execSync(`python3 "${pyScript}" "${jsonPath}" "${pdfPath}"`, { timeout: 30000 });

    if (!fs.existsSync(pdfPath)) throw new Error('El PDF no se generó');

    // 4. Mandar el correo con el PDF adjunto
    await mandarCorreo(pdfPath, embarque1.numero, embarque2.numero, fecha);

    // 5. Limpiar archivos temporales
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.json({ ok: true, mensaje: 'PDF generado y enviado correctamente' });

  } catch (err) {
    console.error('Error al procesar reporte:', err.message);
    // Limpiar aunque haya error
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    res.status(500).json({ error: 'Error al generar el reporte: ' + err.message });
  }
});

// ── ENVÍO DE CORREO ─────────────────────────────────────────────────────────
async function mandarCorreo(pdfPath, numEmb1, numEmb2, fecha) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: CONFIG.email_origen,
      pass: CONFIG.email_password,
    }
  });

  const asunto = `Reporte Lymosa — Est. 14978 — Emb. ${numEmb1} / ${numEmb2} — ${fecha.dia} ${fecha.mes} ${fecha.anio}`;

  await transporter.sendMail({
    from:    `"Lymosa Energy Reportes" <${CONFIG.email_origen}>`,
    to:      CONFIG.email_destino,
    subject: asunto,
    html: `
      <div style="font-family:sans-serif;max-width:480px;">
        <div style="background:#1D9E75;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">Reporte de Evidencia Fotográfica</h2>
          <p style="color:#9FE1CB;margin:4px 0 0;font-size:13px;">Lymosa Energy S.A. de C.V.</p>
        </div>
        <div style="background:#f9f9f7;padding:20px;border-radius:0 0 8px 8px;border:1px solid #e0dfd8;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;width:140px;">Estación</td><td style="font-weight:600;">14978</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Embarque 1</td><td style="font-weight:600;">${numEmb1}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Embarque 2</td><td style="font-weight:600;">${numEmb2}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Fecha</td><td style="font-weight:600;">${fecha.dia} de ${fecha.mes} de ${fecha.anio}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Fotos</td><td style="font-weight:600;">4 fotos adjuntas en PDF</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#aaa;">El reporte en PDF de 2 páginas se adjunta a este correo.</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `reporte_lymosa_${numEmb1}_${numEmb2}.pdf`,
      path:     pdfPath,
      contentType: 'application/pdf'
    }]
  });
}

// ── ARRANCAR SERVIDOR ───────────────────────────────────────────────────────
app.listen(CONFIG.puerto, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   Lymosa Energy — Servidor corriendo         ║
║   http://localhost:${CONFIG.puerto}                    ║
║                                              ║
║   Abre esta dirección en tu celular          ║
║   (conectado a la misma red WiFi)            ║
╚══════════════════════════════════════════════╝
  `);
});
