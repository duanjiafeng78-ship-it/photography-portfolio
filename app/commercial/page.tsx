import { fetchPhotos } from '@/lib/cloudinary';
import JustifiedGallery from '@/components/gallery/JustifiedGallery';

export const revalidate = 60;
export const metadata = { title: '工作样片 — Portfolio' };

export default async function CommercialPage() {
  const photos = await fetchPhotos('commercial');

  return (
    <section className="pt-16 sm:pt-20">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-10 mb-14">
        <div className="w-8 h-px bg-white/20 mb-8" />
        <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.1em] uppercase text-white/90">
          Commercial
        </h1>
        <p className="text-xs tracking-[0.3em] uppercase text-white/30 mt-3 font-light">
          工作样片 · 商业客户作品
        </p>
      </div>
      <JustifiedGallery photos={photos} />
    </section>
  );
}
