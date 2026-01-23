import { useState, useEffect, useRef, useCallback } from 'react'

export function useCachedApi({
  cacheKey,
  fetchFn,
  expiry = 600000, // default: 10 minutes
  debounceMs = 0,
  fetchArgs = []
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Use globalThis.setTimeout for browser compatibility (avoid NodeJS type issue)
  const debounceRef = useRef(null)
  const argsKey = JSON.stringify(fetchArgs)

  // Helper: read from cache
  const getCache = () => {
    try {
      const item = localStorage.getItem(cacheKey)
      if (!item) return null
      const { ts, args, value } = JSON.parse(item)
      // Invalidate if fetchArgs have changed (e.g., search param)
      if (JSON.stringify(args) !== argsKey) return null
      if (expiry > 0 && Date.now() - ts > expiry) return null
      return value
    } catch {
      return null
    }
  }

  // Helper: write to cache
  const setCache = (val) => {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), args: fetchArgs, value: val }))
  }

  // Helper: invalidate cache
  const invalidate = useCallback(() => {
    localStorage.removeItem(cacheKey)
    setData(null)
    setLoading(true)
  }, [cacheKey])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const value = await fetchFn(...fetchArgs)
      setData(value)
      setCache(value)
      setLoading(false)
    } catch (e) {
      setError(e?.message || 'Failed to fetch')
      setLoading(false)
    }
  }, [fetchFn, argsKey])

  // Initial+on fetchArgs change: try cache, fetch if none
  useEffect(() => {
    // Debounce logic for search/filter
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    const cached = getCache()
    if (cached) {
      setData(cached)
      setLoading(false)
    } else {
      if (debounceMs > 0) {
        debounceRef.current = setTimeout(() => {
          fetchData()
        }, debounceMs)
      } else {
        fetchData()
      }
    }
    // eslint-disable-next-line
  }, [argsKey, cacheKey])

  /** Manual refresh (ignores cache and refetches) */
  const refresh = useCallback(() => {
    invalidate()
    fetchData()
  }, [invalidate, fetchData])

  return { data, loading, error, refresh, invalidate }
}
