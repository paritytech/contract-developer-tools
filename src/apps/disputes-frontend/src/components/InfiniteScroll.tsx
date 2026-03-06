import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  children: React.ReactNode;
  loadingText?: string;
}

/**
 * Wrapper that appends an IntersectionObserver sentinel after `children`.
 * Automatically triggers `loadMore` when the sentinel scrolls into view.
 */
export function InfiniteScroll({
  hasMore,
  loading,
  loadMore,
  children,
  loadingText = "Loading...",
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <>
      {children}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-accent/50" />
          <span className="ml-2 text-text-secondary text-sm">{loadingText}</span>
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
