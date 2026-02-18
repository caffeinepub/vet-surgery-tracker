import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateFieldProps {
  id?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

export default function DateField({ id, value, onChange, disabled }: DateFieldProps) {
  const [inputValue, setInputValue] = useState(value ? format(value, 'yyyy-MM-dd') : '');
  const [isOpen, setIsOpen] = useState(false);

  // Sync inputValue with value prop changes (e.g., from MRN auto-prefill)
  useEffect(() => {
    setInputValue(value ? format(value, 'yyyy-MM-dd') : '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If empty, set to null
    if (!newValue) {
      onChange(null);
      return;
    }

    // Parse YYYY-MM-DD format explicitly to avoid browser-dependent parsing
    // The native date input always provides values in YYYY-MM-DD format
    const match = newValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
      const day = parseInt(match[3], 10);
      
      // Create date in local timezone
      const date = new Date(year, month, day);
      
      // Validate that the date is valid (e.g., not Feb 31)
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        onChange(date);
      }
    }
    // If the format doesn't match or is incomplete, don't call onChange
    // This allows the user to type without triggering invalid states
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(format(date, 'yyyy-MM-dd'));
      setIsOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="date"
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn('px-3', !value && 'text-muted-foreground')}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
