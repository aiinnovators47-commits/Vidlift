import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as any
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'Cloudinary not configured' }, { status: 500 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    const fd = new FormData()
    fd.append('file', blob, file.name)

    // Use basic auth in the request URL to avoid computing signatures here.
    const uploadUrl = `https://${apiKey}:${apiSecret}@api.cloudinary.com/v1_1/${cloudName}/auto/upload`

    const res = await fetch(uploadUrl, { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ success: false, error: data || 'Upload failed' }, { status: 500 })

    // derive a thumbnail URL from the uploaded public_id (Cloudinary auto generates video frame images)
    const publicId = data.public_id
    const thumbnail = `https://res.cloudinary.com/${cloudName}/video/upload/w_320,h_180,c_fill/${publicId}.jpg`

    return NextResponse.json({ success: true, secure_url: data.secure_url, public_id: publicId, thumbnail_url: thumbnail, raw: data })
  } catch (err) {
    console.error('Cloudinary upload error', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
