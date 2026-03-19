"use client";

import { useState } from "react";
import { docSections } from "./doc-sections-data";
import { articleContent } from "./article-content-data";
import { DocsTopBar } from "./docs-top-bar";
import { DocsSidebar } from "./docs-sidebar";
import { DocsContent } from "./docs-content";

export default function DocsPage() {
  const [selectedArticle, setSelectedArticle] = useState("quick-start");
  const [searchQuery, setSearchQuery] = useState("");

  const currentArticle =
    articleContent[selectedArticle] || articleContent["quick-start"];

  const filteredSections = docSections
    .map((section) => ({
      ...section,
      articles: section.articles.filter((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((section) => section.articles.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <DocsTopBar />
      <div className="flex-1 flex overflow-hidden">
        <DocsSidebar
          sections={filteredSections}
          selectedArticle={selectedArticle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectArticle={setSelectedArticle}
        />
        <DocsContent
          article={currentArticle}
          onSelectArticle={setSelectedArticle}
        />
      </div>
    </div>
  );
}
