import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPhotos, fetchPhotoById } from '@/lib/cloudinary';
import ProtectedImage from '@/components/gallery/ProtectedImage';

export const revalidate = 60;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: '作品详情 — Portfolio' };
}

export default async function PhotoDetailPage({ params }: Props) {
  const publicId = decodeURIComponent(params.id);
  const photo = await fetchPhotoById(publicId);

  if (!photo) return notFound();

  // Fetch all photos for prev/next navigation
  const allPhotos = await fetchPhotos();
  const currentIndex = allPhotos.findIndex((p) => p.id === publicId);
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;

  // Extract useful EXIF fields
  const exif = photo.exif;
  const exifFields = exif
    ? [
        { label: 'Camera', value: exif.Model && exif.Make && !exif.Model.startsWith(exif.Make) ? `${exif.Make} ${exif.Model}` : exif.Model },
        { label: 'Lens', value: exif.LensModel || exif.Lens },
        { label: 'Focal Length', value: exif.FocalLength },
        { label: 'Aperture', value: exif.FNumber ? `f/${exif.FNumber}` : undefined },
        { label: 'Shutter', value: exif.ExposureTime },
        { label: 'ISO', value: exif.ISO || exif.ISOSpeedRatings },
      ].filter((f) => f.value)
    : [];

  return (
    <section className="pt-16 sm:pt-20 pb-20 min-h-screen">
      {/* Back button — fixed on desktop, inline on mobile */}
      <Link
        href="/gallery"
        className="static sm:fixed sm:top-16 sm:left-6 sm:z-40 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/35 hover:text-white/70 transition-colors duration-300 group mx-6 mt-4 sm:mx-0 sm:mt-0"
      >
        <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
        <span>返回</span>
      </Link>

      {/* Main photo */}
      <div className="flex justify-center px-4 sm:px-10 mb-12">
        <ProtectedImage
          src={photo.url}
          width={photo.width}
          height={photo.height}
          priority
        />
      </div>

      {/* Metadata */}
      <div className="max-w-screen-md mx-auto px-6 sm:px-10">
        {/* Category & Date */}
        <div className="flex items-center gap-4 mb-8">
          {photo.categories.map((cat) => (
            <span key={cat} className="px-3 py-1 border border-white/10 text-[9px] tracking-[0.2em] uppercase text-white/40">
              {cat === 'commercial' ? '工作样片' : '样片'}
            </span>
          ))}
          <span className="text-[10px] text-white/20 tracking-wide">
            {new Date(photo.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* EXIF Grid */}
        {exifFields.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12 py-8 border-t border-b border-white/5">
            {exifFields.map((field) => (
              <div key={field.label}>
                <p className="text-[9px] tracking-[0.2em] uppercase text-white/25 mb-1">{field.label}</p>
                <p className="text-xs text-white/60 font-light">{field.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between pt-4">
          {prevPhoto ? (
            <Link
              href={`/photo/${encodeURIComponent(prevPhoto.id)}`}
              className="text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white/60 transition-colors"
            >
              ← 上一张
            </Link>
          ) : (
            <span />
          )}
          {nextPhoto ? (
            <Link
              href={`/photo/${encodeURIComponent(nextPhoto.id)}`}
              className="text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white/60 transition-colors"
            >
              下一张 →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
