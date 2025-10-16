import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell, BellOff, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ReminderCard from '@/components/ReminderCard';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { getReminders, updateReminder, addDoseLog, deleteReminder } from '@/lib/storage';
import { getSettings } from '@/lib/storage';
import { sendCompartmentCommand, notifyTftPillTaken, updateDisplayInfo } from '@/lib/esp32';
import { initializeNotifications, scheduleReminderNotification, cancelReminderNotification } from '@/lib/notifications';
import type { Reminder, DoseLog } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadReminders();
    initializeNotifications();
  }, []);

  const loadReminders = async () => {
    const data = await getReminders();
    setReminders(data.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    await updateReminder(id, { enabled });
    
    if (enabled) {
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        await scheduleReminderNotification(reminder);
        toast({
          title: "Reminder enabled",
          description: `${reminder.pillName} reminder is now active`,
        });
      }
    } else {
      await cancelReminderNotification(id);
      toast({
        title: "Reminder disabled",
        description: "Reminder has been turned off",
      });
    }
    
    loadReminders();
  };

  const handleReminderClick = (reminder: Reminder) => {
    navigate(`/edit/${reminder.id}`);
  };

  const handleDeleteReminder = async (id: string, pillName: string) => {
    if (confirm(`Are you sure you want to delete ${pillName}?`)) {
      await cancelReminderNotification(id);
      await deleteReminder(id);
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been removed",
      });
      loadReminders();
    }
  };

  const simulateReminder = async (reminder: Reminder) => {
    // Optimistic UI first
    setActiveReminder(reminder);
    setShowDialog(true);

    // Fire-and-forget network in background
    (async () => {
      const settings = await getSettings();
      await Promise.allSettled([
        sendCompartmentCommand(settings, reminder.compartmentType, 'ON'),
        updateDisplayInfo(settings, reminder),
      ]);
    })();
  };

  const handleConfirmation = async (taken: boolean, takenBy: 'user' | 'buzzer' = 'user') => {
    if (!activeReminder) return;

    const settings = await getSettings();
    // Fire network in background to avoid UI delay
    (async () => {
      await sendCompartmentCommand(
        settings,
        activeReminder.compartmentType,
        taken ? 'TAKEN' : 'MISSED'
      );
      if (taken) {
        await notifyTftPillTaken(settings, activeReminder);
      }
    })();

    const log: DoseLog = {
      id: `log_${Date.now()}`,
      reminderId: activeReminder.id,
      pillName: activeReminder.pillName,
      tabletQuantity: activeReminder.tabletQuantity,
      compartmentType: activeReminder.compartmentType,
      foodTiming: activeReminder.foodTiming,
      scheduledTime: activeReminder.time,
      takenTime: Date.now(),
      status: taken ? 'taken' : 'missed',
      takenBy: takenBy,
    };

    await addDoseLog(log);
    
    toast({
      title: taken ? "Marked as taken" : "Marked as missed",
      description: taken 
        ? (takenBy === 'buzzer' ? "Pill has been taken via buzzer!" : "Great job taking your medicine!") 
        : "Don't forget next time",
    });

    setShowDialog(false);
    setActiveReminder(null);
  };

  const getNextReminder = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const upcoming = reminders
      .filter(r => r.enabled && r.time > currentTime)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    return upcoming[0];
  };

  const nextReminder = getNextReminder();
  const todayReminders = reminders.filter(r => r.enabled);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2">Automated Pillbox</h1>
        <p className="text-sm opacity-90">Stay on track with your medication</p>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {nextReminder && (
          <div className="bg-accent rounded-lg p-4 border-2 border-primary/20">
            <p className="text-sm text-accent-foreground font-medium mb-1">Next dose</p>
            <p className="text-2xl font-bold text-accent-foreground">{nextReminder.time}</p>
            <p className="text-sm text-accent-foreground mt-1">{nextReminder.pillName}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Today's Reminders</h2>
          <Button onClick={() => navigate('/add')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>

        {todayReminders.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No reminders set yet</p>
            <Button onClick={() => navigate('/add')}>
              Add Your First Reminder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayReminders.map((reminder) => (
              <div key={reminder.id} className="relative">
                <div onClick={() => handleReminderClick(reminder)}>
                  <ReminderCard
                    reminder={reminder}
                    onToggle={handleToggleReminder}
                    onClick={() => {}}
                  />
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      simulateReminder(reminder);
                    }}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteReminder(reminder.id, reminder.pillName);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={showDialog}
        reminder={activeReminder}
        onConfirm={handleConfirmation}
      />

      <Navigation />
    </div>
  );
};

export default Home;
