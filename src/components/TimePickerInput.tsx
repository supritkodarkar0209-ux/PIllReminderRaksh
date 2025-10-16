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
  const [hour, setHour] = useState<string>('00');
  const [minute, setMinute] = useState<string>('00');

  // Initialize from value
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHour(h.padStart(2, '0'));
      setMinute(m.padStart(2, '0'));
    }
  }, []);

  // Update parent whenever time changes
  useEffect(() => {
    const timeString = `${hour}:${minute}`;
    onChange(timeString);
  }, [hour, minute, onChange]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

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

        {/* 24-hour format: no AM/PM selector */}
      </div>
    </div>
  );
};

export default TimePickerInput;
