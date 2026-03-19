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
import { Search } from "lucide-react";
import { CARD_CLASS } from "./types";

interface BlogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BlogFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSubmit,
}: BlogFiltersProps) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/5"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40 bg-white/5">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  );
}
