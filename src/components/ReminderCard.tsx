import { Clock, Pill, Box } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { Reminder } from '@/types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string, enabled: boolean) => void;
  onClick: () => void;
}

const ReminderCard = ({ reminder, onToggle, onClick }: ReminderCardProps) => {
  const compartmentColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ];

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${compartmentColors[reminder.compartment - 1]}`} />
            <h3 className="font-semibold text-foreground">{reminder.pillName}</h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="h-4 w-4" />
              <span>{reminder.dosage}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-4 w-4" />
              <span>Compartment {reminder.compartment}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Clock className="h-4 w-4" />
              <span>{reminder.time}</span>
            </div>
          </div>
        </div>
        
        <Switch
          checked={reminder.enabled}
          onCheckedChange={(checked) => {
            onToggle(reminder.id, checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Card>
  );
};

export default ReminderCard;
