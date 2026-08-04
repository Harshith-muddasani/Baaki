import { BaakiMark } from '@/components/baaki-mark'

/** Suspense fallback for lazy-loaded routes - kept intentionally brief and quiet. */
export function PageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <BaakiMark className="size-6 animate-pulse" />
    </div>
  )
}
