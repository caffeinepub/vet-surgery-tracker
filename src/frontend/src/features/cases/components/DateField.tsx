import { useState } from 'react';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue) {
      onChange(null);
      return;
    }

    const date = new Date(newValue);
    if (!isNaN(date.getTime())) {
      onChange(date);
    }
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
