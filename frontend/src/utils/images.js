// Neutral book-cover placeholder used when a book has no cover or the URL fails to load.
export const FALLBACK_BOOK_COVER =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

// Swaps a broken cover image to the fallback once, avoiding infinite error loops.
export const handleCoverError = (e) => {
  if (e.currentTarget.src !== FALLBACK_BOOK_COVER) {
    e.currentTarget.src = FALLBACK_BOOK_COVER;
  }
};
