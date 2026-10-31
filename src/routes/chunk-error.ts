/** A new deploy replaces the old script files, so an open tab can fail to load a screen it has not seen yet. */
export const isChunkLoadError = (error: unknown) =>
  error instanceof Error &&
  /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(
    error.message,
  )
