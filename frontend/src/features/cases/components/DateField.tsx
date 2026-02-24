import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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
  className?: string;
  onComplete?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ id, value, onChange, disabled, className, onComplete, inputRef: externalRef }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

    // Use the provided external ref or the internal one
    const inputElementRef = externalRef || internalRef;

    useImperativeHandle(ref, () => inputElementRef.current!);

    // Format date as MM/DD/YYYY
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    // Parse MM/DD/YYYY format
    const parseDate = (str: string): Date | null => {
      const cleaned = str.replace(/\D/g, '');
      if (cleaned.length !== 8) return null;

      const month = parseInt(cleaned.substring(0, 2), 10);
      const day = parseInt(cleaned.substring(2, 4), 10);
      const year = parseInt(cleaned.substring(4, 8), 10);

      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      if (year < 1900 || year > 2100) return null;

      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1) return null; // Invalid day for month

      return date;
    };

    // Update input value when prop value changes
    useEffect(() => {
      setInputValue(formatDate(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;
      
      // Remove all non-digit characters
      const digitsOnly = input.replace(/\D/g, '');
      
      // Format as MM/DD/YYYY with auto-insertion of slashes
      let formatted = '';
      if (digitsOnly.length > 0) {
        formatted = digitsOnly.substring(0, 2);
        if (digitsOnly.length >= 3) {
          formatted += '/' + digitsOnly.substring(2, 4);
        }
        if (digitsOnly.length >= 5) {
          formatted += '/' + digitsOnly.substring(4, 8);
        }
      }

      setInputValue(formatted);

      // If we have 8 digits (complete date), try to parse and validate
      if (digitsOnly.length === 8) {
        const parsed = parseDate(formatted);
        if (parsed) {
          onChange(parsed);
          // Auto-advance to next field after a short delay
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 100);
        } else {
          onChange(null);
        }
      } else if (digitsOnly.length === 0) {
        onChange(null);
      }
    };

    const handleBlur = () => {
      // On blur, try to parse the current input
      if (inputValue) {
        const parsed = parseDate(inputValue);
        if (parsed) {
          onChange(parsed);
          setInputValue(formatDate(parsed));
        } else {
          // Invalid date, clear it
          setInputValue('');
          onChange(null);
        }
      }
    };

    const handleCalendarSelect = (date: Date | undefined) => {
      if (date) {
        onChange(date);
        setInputValue(formatDate(date));
      }
      setIsOpen(false);
    };

    return (
      <div className="flex gap-2">
        <Input
          ref={inputElementRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="MM/DD/YYYY"
          disabled={disabled}
          className={cn('flex-1', className)}
          maxLength={10}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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
);

DateField.displayName = 'DateField';

export default DateField;
