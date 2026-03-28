export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Sur Vercel, /tmp est vide au cold start → copier les données du repo comme base
    if (process.env.VERCEL) {
      const { copyRepoDataToTmp } = await import('@/lib/bootstrap');
      await copyRepoDataToTmp();
    }

    // Si Blob est configuré, écraser avec les données cloud (plus récentes)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { bootstrapDataFromBlob } = await import('@/lib/storage');
      await bootstrapDataFromBlob();
    }
  }
}
