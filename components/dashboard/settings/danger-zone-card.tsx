"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, Trash2 } from "lucide-react";

export function DangerZoneCard() {
  const router = useRouter();
  const { logout, logoutAllDevices } = useAuth();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      toast({ title: "Sign out failed", description: "Please try again", variant: "destructive" });
      setIsSigningOut(false);
    }
  };

  const handleSignOutAll = async () => {
    setIsSigningOut(true);
    try {
      await logoutAllDevices();
      router.push("/");
    } catch {
      toast({ title: "Sign out failed", description: "Please try again", variant: "destructive" });
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }
      toast({ title: "Account deleted", description: "Your account has been permanently deleted" });
      await logout();
      router.push("/");
    } catch (error) {
      toast({ title: "Deletion failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation("");
    }
  };

  return (
    <>
      <Card className="bg-white/5 backdrop-blur-xl border border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Sign out</p>
              <p className="text-sm text-slate-400">Sign out of this device</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
              Sign out
            </Button>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Sign out all devices</p>
              <p className="text-sm text-slate-400">End all active sessions everywhere</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOutAll} disabled={isSigningOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out all
            </Button>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-400">Delete account</p>
              <p className="text-sm text-slate-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, projects, and builds will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-400">
              Type <span className="text-white font-mono font-bold">DELETE</span> to confirm account deletion:
            </p>
            <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Type DELETE to confirm" className="bg-white/5" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmation !== "DELETE" || isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
