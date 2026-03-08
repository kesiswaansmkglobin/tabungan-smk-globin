import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Timer, LogOut } from "lucide-react";

interface IdleWarningModalProps {
  open: boolean;
  remainingSeconds: number;
  onStayActive: () => void;
  onLogout: () => void;
}

export default function IdleWarningModal({
  open,
  remainingSeconds,
  onStayActive,
  onLogout,
}: IdleWarningModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-warning/10">
              <Timer className="h-8 w-8 text-warning" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Sesi Akan Berakhir
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Anda akan otomatis logout dalam{" "}
            <span className="font-bold text-foreground text-lg">
              {remainingSeconds}
            </span>{" "}
            detik karena tidak ada aktivitas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={onStayActive}
            className="w-full"
          >
            Tetap Aktif
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onLogout}
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Sekarang
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
