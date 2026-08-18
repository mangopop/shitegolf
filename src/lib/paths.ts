/** Prefix a site-absolute path with the deployment base (GitHub Pages subpath). */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}

export function photo(file: string): string {
  return href(`/photos/${file}`);
}
