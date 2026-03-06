export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.BLOB_READ_WRITE_TOKEN) {
    const { bootstrapDataFromBlob } = await import('@/lib/storage');
    await bootstrapDataFromBlob();
  }
}
