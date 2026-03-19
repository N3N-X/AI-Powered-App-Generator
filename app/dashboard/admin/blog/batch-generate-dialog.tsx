"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BatchResult {
  topic: string;
  success: boolean;
  post?: { id: string; title: string; slug: string };
  error?: string;
}

interface BatchGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BatchGenerateDialog({
  open,
  onOpenChange,
  onComplete,
}: BatchGenerateDialogProps) {
  const [topics, setTopics] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [generateImages, setGenerateImages] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<BatchResult[] | null>(null);

  const handleGenerate = async () => {
    const topicList = topics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    if (topicList.length === 0) {
      toast({
        title: "Error",
        description: "Enter at least one topic",
        variant: "destructive",
      });
      return;
    }

    if (topicList.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 topics allowed per batch",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResults(null);

    try {
      const response = await fetch("/api/admin/blog/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: topicList,
          status,
          generateImages,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Batch generation failed");
      }

      const data = await response.json();
      setResults(data.results);

      const successful = data.results.filter(
        (r: BatchResult) => r.success,
      ).length;
      toast({
        title: "Batch generation complete",
        description: `${successful} of ${topicList.length} posts created`,
      });

      if (successful > 0) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setTopics("");
      setResults(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Batch Generate Posts
          </DialogTitle>
          <DialogDescription>
            Enter topics (one per line) to auto-generate blog posts with AI
            content and images.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (one per line, max 10)</Label>
              <Textarea
                id="topics"
                placeholder="How AI is Revolutionizing Mobile App Development&#10;Building Your First Cross-Platform App&#10;The Future of No-Code Development"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                rows={8}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                {topics.split("\n").filter((t) => t.trim()).length} topics
                entered
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Post status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "draft" | "published")}
                disabled={isGenerating}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="images">Generate cover images</Label>
                <p className="text-xs text-muted-foreground">
                  Creates AI images and uploads to R2
                </p>
              </div>
              <Switch
                id="images"
                checked={generateImages}
                onCheckedChange={setGenerateImages}
                disabled={isGenerating}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  result.success
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {result.post?.title || result.topic}
                  </p>
                  {result.error && (
                    <p className="text-xs text-red-400 mt-1">{result.error}</p>
                  )}
                  {result.post?.slug && (
                    <p className="text-xs text-muted-foreground mt-1">
                      /{result.post.slug}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {!results ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Posts
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
