export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Sur Vercel, /tmp est vide au cold start → copier les données du repo comme base
    if (process.env.VERCEL) {
      const { copyRepoDataToTmp, seedDemoDataFromSnapshot } = await import('@/lib/bootstrap');
      await copyRepoDataToTmp();
      // En mode démo, les données live sont absentes du repo (gitignorées) :
      // les seed depuis le snapshot versionné
      seedDemoDataFromSnapshot();
    }

    // Si Blob est configuré, écraser avec les données cloud (plus récentes)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { bootstrapDataFromBlob } = await import('@/lib/storage');
      await bootstrapDataFromBlob();
    }
  }
}
