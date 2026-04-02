import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { togglePhotoCategory, togglePhotoFeatured, updatePhotoCaption, fetchPhotoById } from '@/lib/cloudinary';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { PhotoCategory } from '@/lib/types';

async function authenticate(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return !!(token && (await verifyToken(token)));
}

/** Public endpoint: fetch single photo with EXIF data for lightbox. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const publicId = decodeURIComponent(params.id);
  const photo = await fetchPhotoById(publicId);
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(photo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await authenticate(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicId = decodeURIComponent(params.id);

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await authenticate(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicId = decodeURIComponent(params.id);
  const body = await request.json();

  // Handle featured toggle
  if ('featured' in body) {
    const ok = await togglePhotoFeatured(publicId, !!body.featured);
    if (!ok) return NextResponse.json({ error: 'Failed to update featured' }, { status: 500 });
    return NextResponse.json({ ok: true, featured: !!body.featured });
  }

  // Handle category toggle: { category: 'commercial' | 'personal', enabled: boolean }
  if ('category' in body && 'enabled' in body) {
    const category = body.category as PhotoCategory;
    if (category !== 'commercial' && category !== 'personal') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    const ok = await togglePhotoCategory(publicId, category, !!body.enabled);
    if (!ok) return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    return NextResponse.json({ ok: true, category, enabled: !!body.enabled });
  }

  // Handle caption update: { caption: string }
  if ('caption' in body) {
    const caption = typeof body.caption === 'string' ? body.caption : '';
    const ok = await updatePhotoCaption(publicId, caption);
    if (!ok) return NextResponse.json({ error: 'Failed to update caption' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
