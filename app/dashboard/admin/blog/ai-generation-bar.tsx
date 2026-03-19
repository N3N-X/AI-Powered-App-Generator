"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { BlogFormData, GenerationType, slugify } from "./types";

interface AiGenerationBarProps {
  genType: GenerationType;
  onGenTypeChange: (type: GenerationType) => void;
  genTopic: string;
  onGenTopicChange: (topic: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  titleSuggestions: string[];
  onTitleSuggestionsClear: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<BlogFormData>>;
}

export function AiGenerationBar({
  genType,
  onGenTypeChange,
  genTopic,
  onGenTopicChange,
  isGenerating,
  onGenerate,
  titleSuggestions,
  onTitleSuggestionsClear,
  onFormChange,
}: AiGenerationBarProps) {
  return (
    <Card className="bg-violet-500/10 border-violet-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">
            AI Content Generation
          </span>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Enter a topic (e.g. 'How AI is changing mobile development')..."
            value={genTopic}
            onChange={(e) => onGenTopicChange(e.target.value)}
            className="bg-white/5 flex-1"
            disabled={isGenerating}
          />
          <Select
            value={genType}
            onValueChange={(v) => onGenTypeChange(v as GenerationType)}
            disabled={isGenerating}
          >
            <SelectTrigger className="w-44 bg-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Post</SelectItem>
              <SelectItem value="title">Title Ideas</SelectItem>
              <SelectItem value="content">Content Only</SelectItem>
              <SelectItem value="excerpt">Excerpt</SelectItem>
              <SelectItem value="seo">SEO Metadata</SelectItem>
              <SelectItem value="image">Cover Image</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {titleSuggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Click a title to use it:
            </p>
            <div className="flex flex-wrap gap-2">
              {titleSuggestions.map((title, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFormChange((prev) => ({
                      ...prev,
                      title,
                      slug: slugify(title),
                    }));
                    onTitleSuggestionsClear();
                  }}
                  className="text-sm text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border-white/10 h-auto whitespace-normal"
                >
                  {title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
