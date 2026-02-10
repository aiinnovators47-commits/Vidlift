import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { image, prompt } = body
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || process.env.HF_TOKEN
    if (!HF_TOKEN) return NextResponse.json({ error: 'Hugging Face API token not configured' }, { status: 500 })

    // Prepare payload - attempt image-to-image call. If model rejects, we'll fallback to returning original image.
    const modelUrl = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5'

    try {
      const payload: any = {
        inputs: prompt || '',
        options: { wait_for_model: true },
      }
      // If an image was provided, include it if the model supports it
      if (typeof image === 'string') payload.image = image

      const resp = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        // return fallback original image
        const txt = await resp.text().catch(() => '')
        console.warn('HF inference returned non-ok:', resp.status, txt)
        return NextResponse.json({ image }, { status: 200 })
      }

      // The model might return JSON with base64 encoded image or binary buffer depending on model.
      const contentType = resp.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await resp.json().catch(() => null)
        // The inference API may return base64 in `data` or `generated_image` or similar keys.
        if (data) {
          if (data?.images && Array.isArray(data.images) && data.images[0]) {
            // base64 string
            const b64 = data.images[0]
            if (typeof b64 === 'string' && b64.startsWith('data:image')) return NextResponse.json({ image: b64 })
            if (typeof b64 === 'string') return NextResponse.json({ image: `data:image/png;base64,${b64}` })
          }
          // fallback: return original
          return NextResponse.json({ image })
        }
        return NextResponse.json({ image })
      }

      // If response is an image binary (image/png etc)
      const arr = await resp.arrayBuffer()
      const b64 = Buffer.from(arr).toString('base64')
      const mime = contentType.split(';')[0] || 'image/png'
      return NextResponse.json({ image: `data:${mime};base64,${b64}` })

    } catch (err) {
      console.error('HF call failed', err)
      // fallback: echo original
      return NextResponse.json({ image })
    }

  } catch (err: any) {
    console.error('hf-thumbnail error', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}