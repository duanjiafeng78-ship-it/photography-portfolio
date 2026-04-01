import { fetchPhotos } from '@/lib/cloudinary';
import JustifiedGallery from '@/components/gallery/JustifiedGallery';

export const revalidate = 60;
export const metadata = { title: '全部作品 — Portfolio' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function GalleryPage() {
  const photos = await fetchPhotos('personal');
  const randomized = shuffle(photos);

  return (
    <section className="pt-16 sm:pt-20">
      {/* Section header */}
      <div className="max-w-screen-xl mx-auto px-6 sm:px-10 mb-14">
        <div className="w-8 h-px bg-white/20 mb-8" />
        <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.1em] uppercase text-white/90">
          Gallery
        </h1>
        <p className="text-xs tracking-[0.3em] uppercase text-white/30 mt-3 font-light">
          全部作品
        </p>
      </div>

      <JustifiedGallery photos={randomized} />
    </section>
  );
}
