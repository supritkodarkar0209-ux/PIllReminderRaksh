import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePickerInputProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

const TimePickerInput = ({ value, onChange, label = "Reminder Time" }: TimePickerInputProps) => {
  const [hour, setHour] = useState<string>('12');
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Initialize from value
  useEffect(() => {
    if (value) {
      if (value.includes('AM') || value.includes('PM')) {
        // Parse 12-hour format
        const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          setHour(match[1].padStart(2, '0'));
          setMinute(match[2].padStart(2, '0'));
          setPeriod(match[3].toUpperCase() as 'AM' | 'PM');
        }
      } else if (value.includes(':')) {
        // Parse 24-hour format and convert to 12-hour
        const [h, m] = value.split(':');
        const hour24 = parseInt(h);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        setHour(hour12.toString().padStart(2, '0'));
        setMinute(m.padStart(2, '0'));
        setPeriod(hour24 >= 12 ? 'PM' : 'AM');
      }
    }
  }, []);

  // Update parent whenever time changes
  useEffect(() => {
    const timeString = `${hour}:${minute} ${period}`;
    onChange(timeString);
  }, [hour, minute, period, onChange]);

  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    return h.toString().padStart(2, '0');
  });

  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={setHour}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex items-center text-2xl font-bold">:</span>

        <Select value={minute} onValueChange={setMinute}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimePickerInput;
