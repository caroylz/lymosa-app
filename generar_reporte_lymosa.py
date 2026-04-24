"""
Generador de Reporte de Evidencia Fotográfica de Descargas
LYMOSA ENERGY S.A. DE C.V.
- 2 páginas (una por embarque)
- 2 fotos por embarque
- Mismo formato en ambas páginas
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
import os
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# ── Paleta de colores corporativa Lymosa ─────────────────────────────────────
VERDE       = colors.HexColor("#1D9E75")
VERDE_LIGHT = colors.HexColor("#E1F5EE")
GRIS_TEXTO  = colors.HexColor("#444441")
GRIS_CLARO  = colors.HexColor("#D3D1C7")
NEGRO       = colors.HexColor("#1A1A1A")
BLANCO      = colors.white

W, H = letter  # 612 x 792 pts

MARGEN_IZQ  = 2.5 * cm
MARGEN_DER  = 2.5 * cm
MARGEN_SUP  = 2.0 * cm
MARGEN_INF  = 2.0 * cm

# ── Función: dibujar logo SVG-style con shapes ────────────────────────────────
def dibujar_logo(c, x, y, size=28):
    """Logo Lymosa: hoja verde estilizada hecha con paths simples."""
    c.saveState()
    c.setFillColor(VERDE)
    # Hoja principal (triángulo redondeado)
    p = c.beginPath()
    p.moveTo(x + size * 0.5, y + size)
    p.curveTo(x + size * 0.1, y + size * 0.7,
              x,              y + size * 0.3,
              x + size * 0.3, y)
    p.curveTo(x + size * 0.5, y + size * 0.15,
              x + size * 0.85, y + size * 0.4,
              x + size * 0.5, y + size)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    # Punto decorativo
    c.setFillColor(VERDE_LIGHT)
    c.circle(x + size * 0.45, y + size * 0.55, size * 0.1, fill=1, stroke=0)
    c.restoreState()

# ── Función: imagen placeholder (usada cuando no hay foto real) ───────────────
def crear_placeholder(label="FOTO DE EVIDENCIA", w=300, h=200):
    img = Image.new("RGB", (w, h), color=(180, 178, 169))
    draw = ImageDraw.Draw(img)
    # Marco
    draw.rectangle([4, 4, w-5, h-5], outline=(140, 138, 130), width=2)
    # Icono cámara simple
    cx, cy = w // 2, h // 2 - 15
    draw.rectangle([cx-30, cy-20, cx+30, cy+20], outline=(100, 98, 90), width=2)
    draw.ellipse([cx-12, cy-12, cx+12, cy+12], outline=(100, 98, 90), width=2)
    draw.rectangle([cx-8, cy-28, cx+8, cy-22], fill=(100, 98, 90))
    # Texto
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    draw.text((w//2, h//2 + 18), label, fill=(80, 78, 72), anchor="mm", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

# ── Función principal: dibujar UNA página de reporte ─────────────────────────
def dibujar_pagina(c, datos, foto1_path=None, foto2_path=None):
    """
    datos = {
        "numero_embarque": "123456",
        "producto": "Magna",
        "estacion": "14978",
        "fecha_dia": "22",
        "fecha_mes": "Abril",
        "fecha_anio": "2026",
    }
    """
    # ── CABECERA: franja verde superior ──────────────────────────────────────
    c.setFillColor(VERDE)
    c.rect(0, H - 2.2*cm, W, 2.2*cm, fill=1, stroke=0)

    # Texto en franja: RFC y dirección (blanco, pequeño)
    c.setFillColor(BLANCO)
    c.setFont("Helvetica", 6.5)
    c.drawString(MARGEN_IZQ, H - 0.9*cm,
        "Perif. Luis Echeverría Álvarez, #1957 Ote., esquina con Blvd. Nazario Ortiz Garza, en Saltillo, Coah. C.P. 25280.")
    c.drawString(MARGEN_IZQ, H - 1.55*cm,
        "LYMOSA ENERGY S.A. DE C.V.   RFC: LEN201109P97   TEL: 8184784675")

    # ── LOGO (área blanca a la derecha de la franja) ──────────────────────────
    dibujar_logo(c, W - 3.5*cm, H - 1.85*cm, size=22)
    c.setFillColor(BLANCO)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(W - 3.5*cm + 25, H - 1.15*cm, "LYMOSA")
    c.setFont("Helvetica", 6)
    c.drawString(W - 3.5*cm + 25, H - 1.55*cm, "ENERGY")

    # ── TÍTULO PRINCIPAL ──────────────────────────────────────────────────────
    y_titulo = H - 3.4*cm
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 13)
    titulo = "REPORTE DE EVIDENCIA FOTOGRAFICA DE DESCARGAS"
    c.drawCentredString(W / 2, y_titulo, titulo)

    # Línea decorativa bajo título
    c.setStrokeColor(VERDE)
    c.setLineWidth(1.5)
    c.line(MARGEN_IZQ, y_titulo - 5, W - MARGEN_DER, y_titulo - 5)

    # ── DATOS DEL REPORTE ─────────────────────────────────────────────────────
    y_datos = y_titulo - 1.6*cm
    c.setFillColor(GRIS_TEXTO)
    c.setFont("Helvetica", 9)

    fecha_str = f"Saltillo Coahuila a {datos['fecha_dia']} de {datos['fecha_mes']} de {datos['fecha_anio']}."
    c.drawRightString(W - MARGEN_DER, y_datos, f"LUGAR Y FECHA: {fecha_str}")

    y_datos -= 0.75*cm
    # Caja de datos: fondo verde claro
    caja_h = 1.6*cm
    c.setFillColor(VERDE_LIGHT)
    c.setStrokeColor(VERDE)
    c.setLineWidth(0.5)
    c.roundRect(MARGEN_IZQ, y_datos - caja_h + 0.3*cm,
                W - MARGEN_IZQ - MARGEN_DER, caja_h, 4, fill=1, stroke=1)

    c.setFillColor(GRIS_TEXTO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGEN_IZQ + 10, y_datos - 0.1*cm, "NÚMERO DE EMBARQUE:")
    c.setFont("Helvetica", 9)
    c.drawString(MARGEN_IZQ + 145, y_datos - 0.1*cm, datos["numero_embarque"])

    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGEN_IZQ + 10, y_datos - 0.7*cm, "PRODUCTO:")
    c.setFont("Helvetica", 9)
    c.drawString(MARGEN_IZQ + 145, y_datos - 0.7*cm, datos["producto"])

    c.setFont("Helvetica-Bold", 9)
    c.drawString(W/2 + 20, y_datos - 0.1*cm, "ESTACIÓN DE SERVICIO:")
    c.setFont("Helvetica", 9)
    c.drawString(W/2 + 165, y_datos - 0.1*cm, datos["estacion"])

    # ── EVIDENCIA ─────────────────────────────────────────────────────────────
    y_evidencia = y_datos - caja_h - 0.5*cm
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGEN_IZQ, y_evidencia, "EVIDENCIA:")
    c.setStrokeColor(GRIS_CLARO)
    c.setLineWidth(0.5)
    c.line(MARGEN_IZQ + 70, y_evidencia + 3, W - MARGEN_DER, y_evidencia + 3)

    # Área de fotos: 2 fotos lado a lado
    foto_w = (W - MARGEN_IZQ - MARGEN_DER - 0.8*cm) / 2
    foto_h = 8.0*cm
    y_fotos = y_evidencia - foto_h - 0.4*cm

    for i, (foto_path, label) in enumerate([(foto1_path, "Foto 1 — Muestra inicial"),
                                             (foto2_path, "Foto 2 — Purgado final")]):
        x_foto = MARGEN_IZQ + i * (foto_w + 0.8*cm)

        # Marco de foto
        c.setFillColor(VERDE_LIGHT)
        c.setStrokeColor(VERDE)
        c.setLineWidth(0.8)
        c.roundRect(x_foto, y_fotos, foto_w, foto_h, 4, fill=1, stroke=1)

        # Etiqueta de foto
        c.setFillColor(VERDE)
        c.rect(x_foto, y_fotos + foto_h - 0.55*cm, foto_w, 0.55*cm, fill=1, stroke=0)
        c.setFillColor(BLANCO)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(x_foto + foto_w/2, y_fotos + foto_h - 0.35*cm, label)

        # Imagen real o placeholder
        if foto_path and os.path.exists(foto_path):
            try:
                img_reader = ImageReader(foto_path)
                c.drawImage(img_reader,
                            x_foto + 4, y_fotos + 4,
                            width=foto_w - 8,
                            height=foto_h - 0.55*cm - 8,
                            preserveAspectRatio=True,
                            anchor='c',
                            mask='auto')
            except Exception:
                buf = crear_placeholder(label.split("—")[0].strip(),
                                        int(foto_w - 8), int(foto_h - 0.55*cm - 8))
                c.drawImage(ImageReader(buf), x_foto + 4, y_fotos + 4,
                            width=foto_w - 8, height=foto_h - 0.55*cm - 8,
                            preserveAspectRatio=True, anchor='c')
        else:
            buf = crear_placeholder(label.split("—")[0].strip(),
                                    int(foto_w - 8), int(foto_h - 0.55*cm - 8))
            c.drawImage(ImageReader(buf), x_foto + 4, y_fotos + 4,
                        width=foto_w - 8, height=foto_h - 0.55*cm - 8,
                        preserveAspectRatio=True, anchor='c')

    # ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    c.setFillColor(VERDE)
    c.rect(0, 0, W, 1.4*cm, fill=1, stroke=0)

    c.setFillColor(BLANCO)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGEN_IZQ, 0.85*cm, "LYMOSA ENERGY S.A. DE C.V.")
    c.setFont("Helvetica", 6.5)
    c.drawString(MARGEN_IZQ, 0.45*cm, f"RFC: LEN201109P97   TEL: 8184784675")

    c.setFont("Helvetica", 6.5)
    c.drawRightString(W - MARGEN_DER, 0.85*cm,
        "Perif. Luis Echeverría Álvarez, #1957 Ote.,")
    c.drawRightString(W - MARGEN_DER, 0.45*cm,
        "esquina con Blvd. Nazario Ortiz Garza, en Saltillo, Coah. C.P. 25280.")


# ── FUNCIÓN PRINCIPAL: generar PDF de 2 páginas ───────────────────────────────
def generar_reporte(reporte_data, output_path="reporte_lymosa.pdf"):
    """
    reporte_data = {
        "embarque1": {
            "numero_embarque": "123456",
            "producto": "Magna",
            "estacion": "14978",
            "fecha_dia": "22",
            "fecha_mes": "Abril",
            "fecha_anio": "2026",
            "foto1": None,   # ruta absoluta o None para placeholder
            "foto2": None,
        },
        "embarque2": {
            "numero_embarque": "654321",
            "producto": "Diesel",
            "estacion": "14978",
            "fecha_dia": "22",
            "fecha_mes": "Abril",
            "fecha_anio": "2026",
            "foto1": None,
            "foto2": None,
        }
    }
    """
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle("Reporte de Evidencia Fotográfica de Descargas — Lymosa Energy")
    c.setAuthor("Lymosa Energy S.A. de C.V.")

    # ── Página 1: Embarque 1 ──
    emb1 = reporte_data["embarque1"]
    dibujar_pagina(c,
        datos=emb1,
        foto1_path=emb1.get("foto1"),
        foto2_path=emb1.get("foto2"))
    c.showPage()

    # ── Página 2: Embarque 2 ──
    emb2 = reporte_data["embarque2"]
    dibujar_pagina(c,
        datos=emb2,
        foto1_path=emb2.get("foto1"),
        foto2_path=emb2.get("foto2"))
    c.showPage()

    c.save()
    print(f"PDF generado: {output_path}")
    return output_path


# ── EJECUCIÓN DE PRUEBA ───────────────────────────────────────────────────────
if __name__ == "__main__":
    reporte_ejemplo = {
        "embarque1": {
            "numero_embarque": "123456",
            "producto": "Magna",
            "estacion": "14978",
            "fecha_dia": "22",
            "fecha_mes": "Abril",
            "fecha_anio": "2026",
            "foto1": None,
            "foto2": None,
        },
        "embarque2": {
            "numero_embarque": "654321",
            "producto": "Diesel",
            "estacion": "14978",
            "fecha_dia": "22",
            "fecha_mes": "Abril",
            "fecha_anio": "2026",
            "foto1": None,
            "foto2": None,
        }
    }

    generar_reporte(reporte_ejemplo, "/tmp/reporte_lymosa.pdf")


# ── MODO SERVIDOR: recibe JSON desde Node.js ──────────────────────────────────
import sys, json as _json

if __name__ == "__main__" and len(sys.argv) == 3:
    json_path = sys.argv[1]
    pdf_path  = sys.argv[2]
    with open(json_path, 'r') as f:
        datos = _json.load(f)
    generar_reporte(datos, pdf_path)
