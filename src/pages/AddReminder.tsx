import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pill, Box, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import TimePickerInput from '@/components/TimePickerInput';
import { addReminder, updateReminder, getReminders, deleteReminder } from '@/lib/storage';
import { scheduleReminderNotification, cancelReminderNotification } from '@/lib/notifications';
import type { Reminder } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';

const AddReminder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    pillName: '',
    dosage: '',
    compartment: 1,
    time: '',
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
        dosage: reminder.dosage,
        compartment: reminder.compartment,
        time: reminder.time,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pillName || !formData.dosage || !formData.time) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isEdit && id) {
      await updateReminder(id, formData);
      await cancelReminderNotification(id);
      
      const reminders = await getReminders();
      const updatedReminder = reminders.find(r => r.id === id);
      if (updatedReminder?.enabled) {
        await scheduleReminderNotification(updatedReminder);
      }
      
      toast({
        title: "Reminder updated",
        description: "Your reminder has been updated successfully",
      });
    } else {
      const reminder: Reminder = {
        id: `reminder_${Date.now()}`,
        ...formData,
        enabled: true,
        createdAt: Date.now(),
      };
      
      await addReminder(reminder);
      await scheduleReminderNotification(reminder);
      
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
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg, 2 tablets"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compartment" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Compartment Number
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={formData.compartment === num ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, compartment: num })}
                    className="h-12"
                  >
                    {num}
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
