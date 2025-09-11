
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react";

interface OverbreakAlertProps {
    isOpen: boolean;
    onAcknowledge: () => void;
}

export default function OverbreakAlert({ isOpen, onAcknowledge }: OverbreakAlertProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onAcknowledge}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="text-destructive mr-2" />
                        Time's Up!
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Your allotted break time has ended. Please clock back in to continue your work session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onAcknowledge}>Acknowledge</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
