import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Reminder } from '@/types/reminder';

interface ConfirmationDialogProps {
  open: boolean;
  reminder: Reminder | null;
  onConfirm: (taken: boolean) => void;
}

const ConfirmationDialog = ({ open, reminder, onConfirm }: ConfirmationDialogProps) => {
  if (!reminder) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Time to take your medicine!</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-4">
            <p className="text-lg font-semibold text-foreground">{reminder.pillName}</p>
            <p className="text-sm">Dosage: {reminder.dosage}</p>
            <p className="text-sm">Compartment: {reminder.compartment}</p>
            <p className="text-base font-medium pt-2">Did you take your medicine?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={() => onConfirm(false)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            No, I Missed It
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(true)}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            Yes, I Took It
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
