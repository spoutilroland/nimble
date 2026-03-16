/**
 * Construit une cle de contenu scopee par section.
 * Si contentId est present, prefixe la cle pour eviter les collisions
 * entre sections du meme type sur la meme page.
 */
export function ck(contentId: string | undefined, key: string): string {
  return contentId ? `${contentId}--${key}` : key;
}
