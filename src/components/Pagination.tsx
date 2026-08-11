/**
 * Minimal prev/next pagination footer for paginated table views (global
 * tags, global custom fields, notification queues). Zero-indexed page,
 * matching the backend's `page`/`size` query params.
 */
export function Pagination({
  page,
  size,
  totalCount,
  onPageChange,
}: {
  page: number;
  size: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  return (
    <div className="accounts-pagination">
      <button
        type="button"
        className="accounts-btn"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page + 1} of {totalPages} ({totalCount} total)
      </span>
      <button
        type="button"
        className="accounts-btn"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
