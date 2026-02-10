import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Manually triggering hourly email scheduler...');

    // Call the Netlify function
    const netlifyFunctionUrl = process.env.NETLIFY_FUNCTIONS_URL 
      ? `${process.env.NETLIFY_FUNCTIONS_URL}/hourly-email-scheduler`
      : 'http://localhost:8888/.netlify/functions/hourly-email-scheduler';

    const response = await fetch(netlifyFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to trigger email scheduler');
    }

    console.log('✅ Hourly email scheduler triggered successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Hourly email scheduler triggered',
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error triggering hourly email scheduler:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to trigger email scheduler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow GET for health check/testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Hourly email scheduler API endpoint is ready',
    timestamp: new Date().toISOString()
  });
}