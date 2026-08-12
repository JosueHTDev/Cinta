# Cinta — transcriptor de voz

App de transcripción de voz a texto usando la API de Google Cloud Speech-to-Text.
Sin selector de idioma (queda fijo en español, `es-PE`) porque el token no lo requiere.

## 1. Requisitos

- Una **API key de Google Cloud** con la **Speech-to-Text API** habilitada.
  - Google Cloud Console → APIs & Services → Library → busca "Cloud Speech-to-Text API" → Enable.
  - Luego, APIs & Services → Credentials → Create credentials → API key.
  - (Opcional pero recomendado) Restringe esa key para que solo pueda usar "Cloud Speech-to-Text API".

## 2. Correr en local

```bash
npm install
cp .env.example .env.local
# pega tu key en .env.local -> GOOGLE_API_KEY=xxxxx
npm run dev
```

Abre http://localhost:3000

## 3. Desplegar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (o usa `vercel` CLI directo desde aquí).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Vercel detecta Next.js automáticamente, no necesitas tocar nada del build.
4. En **Settings → Environment Variables**, agrega:
   - `GOOGLE_API_KEY` = tu API key de Google Cloud
5. Deploy.

También puedes hacerlo desde la terminal:

```bash
npm i -g vercel
vercel
vercel env add GOOGLE_API_KEY
vercel --prod
```

## Cómo funciona

- El audio (grabado con el micrófono o subido) se envía a `/api/transcribe`, una ruta del
  propio servidor Next.js — tu API key nunca llega al navegador.
- Esa ruta llama a `speech:longrunningrecognize` de Google (soporta audios más largos que
  el modo síncrono) y devuelve un `operationName`.
- El navegador hace polling a `/api/transcribe?name=...` cada 2 segundos hasta que la
  operación termina y muestra el texto.

## Formatos soportados

`WAV`, `MP3`, `FLAC`, `OGG`, `WebM` — el encoding se detecta automáticamente por el tipo de
archivo. La grabación desde el micrófono usa `WebM/Opus` (o `Ogg/Opus` como respaldo),
soportado de forma nativa por casi todos los navegadores modernos.

## Notas

- El idioma está fijo en `es-PE` dentro de `app/api/transcribe/route.ts`
  (constante `LANGUAGE_CODE`) — cámbialo ahí si lo necesitas, ya que no hay selector en la UI.
- Archivos muy largos (varios minutos) pueden tardar más en transcribirse; el polling
  del cliente espera hasta 2 minutos antes de mostrar un error de tiempo agotado.
