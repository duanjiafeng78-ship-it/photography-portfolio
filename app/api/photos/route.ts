import { NextRequest, NextResponse } from 'next/server';
import { fetchPhotos } from '@/lib/cloudinary';
import type { PhotoCategory } from '@/lib/types';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as PhotoCategory | null;

  try {
    const photos = await fetchPhotos(category || undefined);
    return NextResponse.json(photos);
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
