import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteProjectDialogProps {
  projectName: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteProjectDialog({
  projectName,
  projectId,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText === projectName;

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText(""); // Reset on close
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <div>
              This action <strong>cannot be undone</strong>. This will
              permanently delete the project:
            </div>
            <div className="font-mono font-semibold text-foreground">
              {projectName}
            </div>
            <div className="text-sm">
              Project ID: <span className="font-mono text-xs">{projectId}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> All resources in this project will be
            deleted, including all associated data. This cannot be reversed.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type <strong>{projectName}</strong> to confirm:
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isConfirmValid) {
                handleConfirm();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
