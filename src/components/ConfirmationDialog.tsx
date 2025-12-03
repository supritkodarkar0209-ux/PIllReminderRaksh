import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import type { Reminder } from '@/types/reminder';
import { getSettings } from '@/lib/storage';
import { sendBuzzerCommand, checkBuzzerStatus } from '@/lib/esp32';

interface ConfirmationDialogProps {
  open: boolean;
  reminder: Reminder | null;
  onConfirm: (taken: boolean, takenBy?: 'user' | 'buzzer') => void;
}

const ConfirmationDialog = ({ open, reminder, onConfirm }: ConfirmationDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [buzzerStatus, setBuzzerStatus] = useState<{compartmentType: 'A' | 'B' | 'C' | 'D' | null, status: 'taken' | 'idle'}>({ compartmentType: null, status: 'idle' });

  useEffect(() => {
    if (open && reminder) {
      const checkBuzzer = async () => {
        const settings = await getSettings();
        const status = await checkBuzzerStatus(settings);
        setBuzzerStatus(status);
        
        if (status.status === 'taken' && status.compartmentType && 
            (Array.isArray(reminder.compartmentType) 
              ? reminder.compartmentType.includes(status.compartmentType)
              : reminder.compartmentType === status.compartmentType)) {
          onConfirm(true, 'buzzer');
        }
      };
      
      const interval = setInterval(checkBuzzer, 300); // Even faster polling
      return () => clearInterval(interval);
    }
  }, [open, reminder, onConfirm]);

  const handleConfirm = async (taken: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      onConfirm(taken, 'user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuzzerConfirm = async () => {
    if (isProcessing || !reminder) return;
    setIsProcessing(true);
    
    try {
      const settings = await getSettings();
      const compartments = Array.isArray(reminder.compartmentType) 
        ? reminder.compartmentType 
        : [reminder.compartmentType];
      
      // Send buzzer command for the first compartment (or all if needed)
      await sendBuzzerCommand(settings, compartments[0]);
      onConfirm(true, 'buzzer');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!reminder) return null;

  const foodTimingLabels = {
    'before': 'Before Food',
    'after': 'After Food',
    'anytime': 'Anytime'
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Time to take your medicine!</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-4">
            <p className="text-lg font-semibold text-foreground">{reminder.pillName}</p>
            {typeof reminder.tabletQuantity === 'number' && reminder.tabletQuantity > 0 && (
              <p className="text-sm">Tablets: {reminder.tabletQuantity}</p>
            )}
            <p className="text-sm">
              Compartment{Array.isArray(reminder.compartmentType) && reminder.compartmentType.length > 1 ? 's' : ''}: {' '}
              {Array.isArray(reminder.compartmentType) 
                ? reminder.compartmentType.join(', ')
                : reminder.compartmentType
              }
            </p>
            <p className="text-sm">Food Timing: {foodTimingLabels[reminder.foodTiming]}</p>
            <p className="text-base font-medium pt-2">Did you take your medicine?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2">
          <Button
            onClick={handleBuzzerConfirm}
            disabled={isProcessing}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Buzzer Button Pressed'}
          </Button>
          <div className="flex gap-2 w-full">
            <AlertDialogCancel 
              onClick={() => handleConfirm(false)}
              disabled={isProcessing}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Processing...' : 'No, I Missed It'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleConfirm(true)}
              disabled={isProcessing}
              className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            >
              {isProcessing ? 'Processing...' : 'Yes, I Took It'}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
