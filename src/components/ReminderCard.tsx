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
  const compartmentColors = {
    'A': 'bg-blue-500',
    'B': 'bg-green-500',
    'C': 'bg-purple-500',
    'D': 'bg-orange-500',
  };

  const foodTimingLabels = {
    'before': 'Before Food',
    'after': 'After Food',
    'anytime': 'Anytime'
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${compartmentColors[reminder.compartmentType]}`} />
            <h3 className="font-semibold text-foreground">{reminder.pillName}</h3>
          </div>
          
          <div className="space-y-1">
            {typeof reminder.tabletQuantity === 'number' && reminder.tabletQuantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Pill className="h-4 w-4" />
                <span>{reminder.tabletQuantity} tablet{reminder.tabletQuantity > 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-4 w-4" />
              <span>Compartment {reminder.compartmentType}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🍽️</span>
              <span>{foodTimingLabels[reminder.foodTiming]}</span>
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
