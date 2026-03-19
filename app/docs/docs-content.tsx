"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocsContentProps {
  article: { title: string; content: string };
  onSelectArticle: (slug: string) => void;
}

export function DocsContent({ article, onSelectArticle }: DocsContentProps) {
  // Handle internal doc links - convert /docs/slug to client-side navigation
  const handleLinkClick = (href: string) => {
    if (href.startsWith("/docs/")) {
      const slug = href.replace("/docs/", "");
      onSelectArticle(slug);
      return true; // Handled
    }
    return false; // Let browser handle
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Article Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          <Badge variant="info">Documentation</Badge>
        </div>

        {/* Article Content */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardContent className="p-8">
            <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-slate-300 prose-li:text-gray-700 dark:prose-li:text-slate-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-white/10 prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-th:text-gray-900 dark:prose-th:text-white prose-td:text-gray-700 dark:prose-td:text-slate-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    const isInternalDoc = href?.startsWith("/docs/");
                    if (isInternalDoc) {
                      return (
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            if (href) handleLinkClick(href);
                          }}
                          className="cursor-pointer"
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-violet-500" />
                Video Tutorial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Watch a step-by-step video guide for this topic.
              </p>
              <Badge className="mt-3" variant="outline">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-500" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Explore working examples and templates.
              </p>
              <Badge className="mt-3" variant="outline">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
