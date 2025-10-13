import { CheckCircle, XCircle, Clock, Box } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DoseLog } from '@/types/reminder';

interface DoseLogCardProps {
  log: DoseLog;
}

const DoseLogCard = ({ log }: DoseLogCardProps) => {
  const isTaken = log.status === 'taken';
  const date = new Date(log.takenTime);

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
          <h3 className="font-semibold text-foreground mb-1">{log.pillName}</h3>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Scheduled: {log.scheduledTime}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-3 w-3" />
              <span>Compartment {log.compartment}</span>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
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
