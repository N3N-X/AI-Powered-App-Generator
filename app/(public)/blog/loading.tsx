import { Loader2 } from "lucide-react";

export default function BlogLoading() {
  return (
    <div className="flex items-center justify-center py-20 animate-in fade-in duration-300">
      <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
    </div>
  );
}
