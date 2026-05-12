export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTmdbSyncScheduler } = await import('@/lib/tmdb-sync');
    startTmdbSyncScheduler();
  }
}
