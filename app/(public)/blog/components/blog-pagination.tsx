import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  tag?: string;
}

export function BlogPagination({
  currentPage,
  totalPages,
  tag,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Button
        variant="outline"
        size="sm"
        asChild
        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
      >
        <Link
          href={`/blog?${new URLSearchParams({
            ...(tag && { tag }),
            page: String(currentPage - 1),
          })}`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Link>
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => {
            if (totalPages <= 7) return true;
            if (p === 1 || p === totalPages) return true;
            if (Math.abs(p - currentPage) <= 1) return true;
            return false;
          })
          .map((p, i, arr) => (
            <span key={p} className="flex items-center">
              {i > 0 && arr[i - 1] !== p - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <Button
                variant={p === currentPage ? "default" : "ghost"}
                size="sm"
                asChild
                className="w-9 h-9"
              >
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(tag && { tag }),
                    page: String(p),
                  })}`}
                >
                  {p}
                </Link>
              </Button>
            </span>
          ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        asChild
        className={
          currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
        }
      >
        <Link
          href={`/blog?${new URLSearchParams({
            ...(tag && { tag }),
            page: String(currentPage + 1),
          })}`}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
