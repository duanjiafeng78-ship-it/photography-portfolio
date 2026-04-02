import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUploadParams, checkPhotoByHash, checkPhotoByEtag } from '@/lib/cloudinary';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { PhotoCategory } from '@/lib/types';

const VALID_CATEGORIES = new Set<string>(['commercial', 'personal']);

/**
 * GET /api/upload?etag=<md5>   — check duplicate by content hash (etag)
 * GET /api/upload?sha256=<hash> — check duplicate by hash (legacy)
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const etag = request.nextUrl.searchParams.get('etag');
  const sha256 = request.nextUrl.searchParams.get('sha256');

  if (etag) {
    const exists = await checkPhotoByEtag(etag);
    return NextResponse.json({ exists });
  }
  if (sha256) {
    const exists = await checkPhotoByHash(sha256);
    return NextResponse.json({ exists });
  }
  return NextResponse.json({ error: 'missing etag or sha256' }, { status: 400 });
}

/**
 * POST /api/upload — generate signed upload params.
 * Body: { categories: string[], sha256?: string, filename?: string }
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { categories, sha256, filename } = body;

  // Validate categories
  if (!Array.isArray(categories) || categories.length === 0 || !categories.every((c: string) => VALID_CATEGORIES.has(c))) {
    return NextResponse.json({ error: 'Invalid categories' }, { status: 400 });
  }

  const params = generateSignedUploadParams(
    categories as PhotoCategory[],
    sha256 || undefined,
    filename || undefined,
  );
  return NextResponse.json(params);
}
