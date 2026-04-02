export type PhotoCategory = 'commercial' | 'personal';

export interface Photo {
  id: string;         // Cloudinary public_id
  url: string;        // Watermarked delivery URL
  width: number;
  height: number;
  categories: PhotoCategory[];
  createdAt: string;
  featured?: boolean; // whether shown in homepage slideshow
  caption?: string;   // photographer's story / description
}
