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

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserFilters({
  search,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  onSubmit,
}: UserFiltersProps) {
  return (
    <Card className="liquid-glass-card">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/5"
            />
          </div>
          <Select value={planFilter} onValueChange={onPlanFilterChange}>
            <SelectTrigger className="w-40 bg-white/5">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="ELITE">Elite</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  );
}
