import { CheckCircle, XCircle, Clock, Box, Bell, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DoseLog } from '@/types/reminder';

interface DoseLogCardProps {
  log: DoseLog;
}

const DoseLogCard = ({ log }: DoseLogCardProps) => {
  const isTaken = log.status === 'taken';
  const date = new Date(log.takenTime);

  const foodTimingLabels = {
    'before': 'Before Food',
    'after': 'After Food',
    'anytime': 'Anytime'
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${isTaken ? 'bg-success/10' : 'bg-destructive/10'}`}>
          {isTaken ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground">{log.pillName}</h3>
            <div className="flex items-center gap-1">
              {log.takenBy === 'buzzer' ? (
                <Bell className="h-3 w-3 text-orange-500" />
              ) : (
                <User className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            {typeof log.tabletQuantity === 'number' && log.tabletQuantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📊</span>
                <span>{log.tabletQuantity} tablet{log.tabletQuantity > 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-3 w-3" />
              <span>Compartment {log.compartmentType}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🍽️</span>
              <span>{foodTimingLabels[log.foodTiming]}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Scheduled: {log.scheduledTime}</span>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              {log.takenBy === 'buzzer' && ' (via buzzer)'}
            </div>
          </div>
        </div>
        
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isTaken 
            ? 'bg-success/10 text-success' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {log.status}
        </span>
      </div>
    </Card>
  );
};

export default DoseLogCard;
