import { v2 as cloudinary } from 'cloudinary';
import type { Photo, PhotoCategory } from './types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Build a Cloudinary URL (no server-side watermark — CSS watermark applied in frontend).
 */
export function buildWatermarkedUrl(publicId: string, width = 1200): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  // Use proxy path for better China accessibility; falls back to direct URL on server
  if (typeof window !== 'undefined') {
    return `/cdn-img/image/upload/w_${width},c_limit,f_auto,q_auto/${publicId}`;
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},c_limit,f_auto,q_auto/${publicId}`;
}

/** Map Cloudinary tags to PhotoCategory array. */
function mapCategories(tags?: string[]): PhotoCategory[] {
  return (['commercial', 'personal'] as const).filter((t) => tags?.includes(t));
}

/**
 * Fetch photos from Cloudinary, optionally filtered by category tag.
 */
export async function fetchPhotos(category?: PhotoCategory): Promise<Photo[]> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return [];

  const expression = category ? `tags=${category} AND folder=portfolio/*` : 'folder=portfolio/*';

  try {
    const result = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .with_field('tags')
      .with_field('image_metadata')
      .max_results(500)
      .execute();

    return (result.resources || []).map((r: CloudinaryResource) => ({
      id: r.public_id,
      url: buildWatermarkedUrl(r.public_id),
      width: r.width,
      height: r.height,
      categories: mapCategories(r.tags),
      createdAt: r.created_at,
      featured: r.tags?.includes('featured') ?? false,
    }));
  } catch (error) {
    console.error('Cloudinary fetch error:', error);
    return [];
  }
}

/**
 * Generate signed upload parameters for direct browser-to-Cloudinary upload.
 * Stores sha256 and original filename in context for duplicate detection.
 */
export function generateSignedUploadParams(categories: PhotoCategory[], sha256?: string, filename?: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'portfolio';
  const tags = categories.join(',');

  const contextParts: string[] = [];
  if (sha256) contextParts.push(`sha256=${sha256}`);
  if (filename) contextParts.push(`filename=${filename}`);
  const context = contextParts.length > 0 ? contextParts.join('|') : undefined;

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    tags,
  };
  if (context) paramsToSign.context = context;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    timestamp,
    signature,
    folder,
    tags,
    context,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

/**
 * Check if a photo with the given SHA-256 hash already exists (stored in context).
 */
export async function checkPhotoByHash(sha256: string): Promise<boolean> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
  try {
    const result = await cloudinary.search
      .expression(`context.sha256="${sha256}" AND folder=portfolio/*`)
      .max_results(1)
      .execute();
    return (result.total_count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Check if a photo with the same content (etag/MD5) already exists.
 * Computes MD5 on the client and compares against Cloudinary etags.
 */
export async function checkPhotoByEtag(etag: string): Promise<boolean> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !etag) return false;
  try {
    const result = await cloudinary.search
      .expression(`folder=portfolio/* AND etag=${etag}`)
      .max_results(1)
      .execute();
    return (result.total_count ?? 0) > 0;
  } catch {
    return false;
  }
}

interface CloudinaryResource {
  public_id: string;
  width: number;
  height: number;
  created_at: string;
  tags?: string[];
  image_metadata?: Record<string, string>;
}

/**
 * Toggle a specific category tag on a photo (add or remove).
 */
export async function togglePhotoCategory(publicId: string, category: PhotoCategory, enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      await cloudinary.uploader.add_tag(category, [publicId]);
    } else {
      await cloudinary.uploader.remove_tag(category, [publicId]);
    }
    return true;
  } catch (error) {
    console.error('Failed to toggle photo category:', error);
    return false;
  }
}

/**
 * Toggle the "featured" tag on a photo for homepage slideshow.
 */
export async function togglePhotoFeatured(publicId: string, featured: boolean): Promise<boolean> {
  try {
    if (featured) {
      await cloudinary.uploader.add_tag('featured', [publicId]);
    } else {
      await cloudinary.uploader.remove_tag('featured', [publicId]);
    }
    return true;
  } catch (error) {
    console.error('Failed to toggle featured:', error);
    return false;
  }
}

/**
 * Fetch only featured photos for homepage slideshow.
 */
export async function fetchFeaturedPhotos(): Promise<Photo[]> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return [];
  try {
    const result = await cloudinary.search
      .expression('tags=featured AND folder=portfolio/*')
      .sort_by('created_at', 'desc')
      .with_field('tags')
      .max_results(20)
      .execute();

    return (result.resources || []).map((r: CloudinaryResource) => ({
      id: r.public_id,
      url: buildWatermarkedUrl(r.public_id),
      width: r.width,
      height: r.height,
      categories: mapCategories(r.tags),
      createdAt: r.created_at,
      featured: true,
    }));
  } catch (error) {
    console.error('Cloudinary featured fetch error:', error);
    return [];
  }
}

/**
 * Fetch a single photo by public_id, including EXIF metadata.
 */
export async function fetchPhotoById(publicId: string): Promise<Photo & { exif?: Record<string, string> } | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null;

  try {
    const r = await cloudinary.api.resource(publicId, {
      image_metadata: true,
    }) as CloudinaryResource & { image_metadata?: Record<string, string> };

    return {
      id: r.public_id,
      url: buildWatermarkedUrl(r.public_id, 2000),
      width: r.width,
      height: r.height,
      categories: mapCategories(r.tags),
      createdAt: r.created_at,
      exif: r.image_metadata ?? undefined,
    };
  } catch (error) {
    console.error('Cloudinary fetch photo by id error:', error);
    return null;
  }
}
