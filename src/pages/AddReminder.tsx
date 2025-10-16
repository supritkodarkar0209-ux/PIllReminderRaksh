import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pill, Box, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import TimePickerInput from '@/components/TimePickerInput';
import { addReminder, updateReminder, getReminders, deleteReminder, getSettings } from '@/lib/storage';
import { scheduleReminderNotification, cancelReminderNotification } from '@/lib/notifications';
import { updateDisplayInfo } from '@/lib/esp32';
import type { Reminder } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';

const AddReminder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    pillName: '',
    tabletQuantity: '' as number | '' ,
    compartmentType: 'A' as 'A' | 'B' | 'C' | 'D',
    time: '',
    foodTiming: 'anytime' as 'before' | 'after' | 'anytime',
  });

  useEffect(() => {
    if (id) {
      loadReminder(id);
      setIsEdit(true);
    }
  }, [id]);

  const loadReminder = async (reminderId: string) => {
    const reminders = await getReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      setFormData({
        pillName: reminder.pillName,
        tabletQuantity: reminder.tabletQuantity,
        compartmentType: reminder.compartmentType,
        time: reminder.time,
        foodTiming: reminder.foodTiming,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pillName || !formData.time) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isEdit && id) {
      const normalized = {
        ...formData,
        tabletQuantity: formData.tabletQuantity === '' ? 0 : formData.tabletQuantity,
      };
      await updateReminder(id, normalized as any);
      await cancelReminderNotification(id);
      
      const reminders = await getReminders();
      const updatedReminder = reminders.find(r => r.id === id);
      if (updatedReminder?.enabled) {
        await scheduleReminderNotification(updatedReminder);
      }
      
      // Update ESP32 display
      const settings = await getSettings();
      if (settings.esp32Ip && updatedReminder) {
        await updateDisplayInfo(settings, updatedReminder);
      }
      
      toast({
        title: "Reminder updated",
        description: "Your reminder has been updated successfully",
      });
    } else {
      const reminder: Reminder = {
        id: `reminder_${Date.now()}`,
        ...formData,
        tabletQuantity: formData.tabletQuantity === '' ? 0 : (formData.tabletQuantity as number),
        enabled: true,
        createdAt: Date.now(),
      };
      
      await addReminder(reminder);
      await scheduleReminderNotification(reminder);
      
      // Update ESP32 display
      const settings = await getSettings();
      if (settings.esp32Ip) {
        await updateDisplayInfo(settings, reminder);
      }
      
      toast({
        title: "Reminder added",
        description: "Your new reminder has been created",
      });
    }

    navigate('/');
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this reminder?')) {
      await cancelReminderNotification(id);
      await deleteReminder(id);
      
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been removed",
      });
      
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEdit ? 'Edit Reminder' : 'Add Reminder'}
        </h1>
      </header>

      <div className="max-w-lg mx-auto p-4">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pillName" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medicine Name
              </Label>
              <Input
                id="pillName"
                value={formData.pillName}
                onChange={(e) => setFormData({ ...formData, pillName: e.target.value })}
                placeholder="e.g., Aspirin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tabletQuantity">Tablet Quantity</Label>
              <Input
                id="tabletQuantity"
                type="number"
                min={0}
                step={1}
                value={formData.tabletQuantity}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setFormData({ ...formData, tabletQuantity: '' });
                    return;
                  }
                  const val = parseInt(raw, 10);
                  setFormData({ ...formData, tabletQuantity: isNaN(val) || val < 0 ? '' : val });
                }}
                placeholder="Enter number of tablets (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compartmentType" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Compartment Type
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.compartmentType === type ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, compartmentType: type as 'A' | 'B' | 'C' | 'D' })}
                    className="h-12"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodTiming">Food Timing</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'before', label: 'Before Food' },
                  { value: 'after', label: 'After Food' },
                  { value: 'anytime', label: 'Anytime' }
                ].map((timing) => (
                  <Button
                    key={timing.value}
                    type="button"
                    variant={formData.foodTiming === timing.value ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, foodTiming: timing.value as 'before' | 'after' | 'anytime' })}
                    className="h-12 text-xs"
                  >
                    {timing.label}
                  </Button>
                ))}
              </div>
            </div>

            <TimePickerInput
              value={formData.time}
              onChange={(time) => setFormData({ ...formData, time })}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {isEdit ? 'Update Reminder' : 'Add Reminder'}
              </Button>
              
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="px-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default AddReminder;
