import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Plus, ExternalLink, Users } from "lucide-react";

export function AdminQuickActions() {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common management tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/admin/blog">
              <Plus className="h-4 w-4 mr-2" />
              New Blog Post
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Blog
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
