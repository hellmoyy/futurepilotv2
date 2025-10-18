import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint untuk debug image upload
 * GET /api/ai/test-image
 */
export async function GET() {
  return NextResponse.json({
    message: 'Image test endpoint active',
    instructions: 'POST an image to test encoding'
  });
}

/**
 * POST /api/ai/test-image
 * Test image encoding dan validation
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 });
    }

    // Validate format
    const isValidFormat = imageUrl.startsWith('data:image/');
    const imageType = imageUrl.substring(5, imageUrl.indexOf(';'));
    const isBase64 = imageUrl.includes(';base64,');
    const sizeKB = Math.round(imageUrl.length / 1024);

    // Extract first few bytes for validation
    const base64Data = imageUrl.split(',')[1];
    const firstBytes = base64Data?.substring(0, 50);

    return NextResponse.json({
      success: true,
      validation: {
        isValidFormat,
        imageType,
        isBase64,
        sizeKB,
        totalLength: imageUrl.length,
        maxSizeKB: 10 * 1024,
        withinLimit: sizeKB < 10 * 1024,
        firstBytesPreview: firstBytes,
      },
      recommendations: {
        format: isValidFormat ? '✅ Valid data URI' : '❌ Invalid format',
        encoding: isBase64 ? '✅ Base64 encoded' : '❌ Not base64',
        size: sizeKB < 10 * 1024 ? '✅ Within 10MB limit' : '❌ Exceeds 10MB',
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
