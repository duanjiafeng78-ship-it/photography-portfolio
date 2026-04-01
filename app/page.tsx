import Hero from '@/components/common/Hero';
import { fetchFeaturedPhotos, fetchPhotos } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function HomePage() {
  // Use featured photos if any exist; otherwise fall back to random selection
  let bgPhotos = await fetchFeaturedPhotos();
  if (bgPhotos.length === 0) {
    const all = await fetchPhotos();
    bgPhotos = shuffle(all).slice(0, 7);
  } else {
    bgPhotos = shuffle(bgPhotos);
  }
  return <Hero backgroundPhotos={bgPhotos} />;
}
