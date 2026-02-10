import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, title, description, tags, source } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
    }

    // TODO: Save to database (MongoDB/Prisma)
    // This is a placeholder - implement with your database
    const metadata = {
      videoId,
      userId: session.user.email,
      title,
      description,
      tags: tags || [],
      source: source || 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Example Prisma usage (uncomment when DB is set up):
    // const saved = await db.videoMetadata.upsert({
    //   where: { videoId },
    //   update: metadata,
    //   create: metadata
    // })

    console.log('Video metadata saved:', metadata)

    return NextResponse.json({
      success: true,
      message: 'Metadata saved successfully',
      data: metadata
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error saving video metadata:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save metadata',
        success: false
      },
      { status: 500 }
    )
  }
}
