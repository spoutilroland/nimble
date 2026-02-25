export function slugify(text: string): string {
  return '/' + text.toLowerCase()
    .replace(/[àáâ]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[ùûü]/g, 'u')
    .replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function slugifyId(text: string): string {
  return text.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
