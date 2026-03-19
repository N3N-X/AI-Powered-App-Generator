"use client";

import { Book, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  articles: { title: string; slug: string }[];
}

interface DocsSidebarProps {
  sections: DocSection[];
  selectedArticle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectArticle: (slug: string) => void;
}

export function DocsSidebar({
  sections,
  selectedArticle,
  searchQuery,
  onSearchChange,
  onSelectArticle,
}: DocsSidebarProps) {
  return (
    <aside className="w-72 border-r border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-xl hidden lg:block">
      <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Book className="h-6 w-6 text-violet-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Documentation
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/60 dark:bg-white/5"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-2 mb-3 px-2">
                <section.icon className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <div className="space-y-1">
                {section.articles.map((article) => (
                  <button
                    key={article.slug}
                    onClick={() => onSelectArticle(article.slug)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                      selectedArticle === article.slug
                        ? "bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{article.title}</span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          selectedArticle === article.slug &&
                            "text-violet-500",
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
