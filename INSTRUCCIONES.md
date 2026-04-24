# LYMOSA ENERGY — App de Reportes Fotográficos
## Instrucciones de instalación y uso

---

## ¿QUÉ ARCHIVOS TIENES?

```
lymosa-app/
  ├── index.html                  ← La app que ven los despachadores en el celular
  ├── server.js                   ← El cerebro que genera el PDF y manda el correo
  ├── generar_reporte_lymosa.py   ← El generador del PDF formato Lymosa
  └── INSTRUCCIONES.md            ← Este archivo
```

---

## PASO 1 — Instalar lo necesario en tu computadora (UNA SOLA VEZ)

### 1a. Instalar Node.js
- Ve a: https://nodejs.org
- Descarga la versión "LTS" (la recomendada)
- Instálala como cualquier programa

### 1b. Instalar Python
- Ve a: https://python.org/downloads
- Descarga la versión más reciente
- ⚠️ Durante la instalación, marca la casilla "Add Python to PATH"

### 1c. Instalar las librerías de Python
Abre la terminal (en Windows: busca "cmd" o "PowerShell") y escribe:
```
pip install reportlab Pillow
```

### 1d. Instalar las librerías de Node
En la misma terminal, ve a la carpeta de la app y escribe:
```
cd lymosa-app
npm install express nodemailer
```

---

## PASO 2 — Configurar tu correo

Abre el archivo `server.js` con el Bloc de notas y busca esta sección:

```
const CONFIG = {
  email_destino:  'TU_CORREO@gmail.com',   ← pon aquí TU correo
  email_origen:   'TU_CORREO@gmail.com',   ← el mismo correo
  email_password: 'TU_CONTRASEÑA_DE_APP',  ← ver instrucciones abajo
  puerto: 3000,
};
```

### ¿Cómo obtengo la "contraseña de app" de Gmail?
1. Entra a tu cuenta de Google
2. Ve a: Seguridad → Verificación en dos pasos (actívala si no está activa)
3. Ve a: Seguridad → Contraseñas de aplicaciones
4. Crea una nueva contraseña para "Otra aplicación" → escribe "Lymosa"
5. Google te dará una contraseña de 16 letras — cópiala en el archivo

---

## PASO 3 — Arrancar la app

En la terminal, dentro de la carpeta lymosa-app:
```
node server.js
```

Verás este mensaje:
```
╔══════════════════════════════════════════════╗
║   Lymosa Energy — Servidor corriendo         ║
║   http://localhost:3000                      ║
╚══════════════════════════════════════════════╝
```

---

## PASO 4 — Que los despachadores usen la app

### Desde la misma red WiFi (para probar):
El despachador abre en su celular:
```
http://[IP de tu computadora]:3000
```
Para ver tu IP: en Windows escribe `ipconfig` en la terminal.

### Para uso permanente (recomendado):
Sube la app a Railway.app:
1. Ve a https://railway.app y crea una cuenta gratis
2. Crea un nuevo proyecto → "Deploy from GitHub"
3. Sube los archivos a GitHub primero (github.com → New repository)
4. Railway te da una URL pública, ej: `https://lymosa-reportes.railway.app`
5. Manda esa URL a tus despachadores por WhatsApp

### Instalar en el celular como app:
- **Android**: Abre la URL en Chrome → menú ⋮ → "Añadir a pantalla de inicio"
- **iPhone**: Abre la URL en Safari → compartir □ → "Añadir a pantalla de inicio"

Ya aparece como una app con el logo de Lymosa.

---

## RESUMEN RÁPIDO

```
1. npm install express nodemailer   (una vez)
2. pip install reportlab Pillow     (una vez)
3. Edita server.js → pon tu correo
4. node server.js                   (cada vez que quieras usarlo)
5. Abre http://localhost:3000       en el celular
```

---

## SOPORTE

Si algo no funciona, busca un desarrollador freelance en:
- workana.com
- freelancer.com.mx

Muéstrale estos archivos — están listos para funcionar,
solo necesita conectarlos y subirlos al servidor.
