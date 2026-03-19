"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { UserData, EditFormData } from "./types";

interface EditUserDialogProps {
  user: UserData | null;
  editForm: EditFormData;
  onEditFormChange: (form: EditFormData) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditUserDialog({
  user,
  editForm,
  onEditFormChange,
  isSaving,
  onClose,
  onSave,
}: EditUserDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#0f0f15] border-white/10">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={editForm.plan}
              onValueChange={(value) =>
                onEditFormChange({ ...editForm, plan: value })
              }
            >
              <SelectTrigger className="bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ELITE">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={editForm.role}
              onValueChange={(value) =>
                onEditFormChange({ ...editForm, role: value })
              }
            >
              <SelectTrigger className="bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Credits</Label>
            <Input
              type="number"
              value={editForm.credits}
              onChange={(e) =>
                onEditFormChange({
                  ...editForm,
                  credits: parseInt(e.target.value) || 0,
                })
              }
              className="bg-white/5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
