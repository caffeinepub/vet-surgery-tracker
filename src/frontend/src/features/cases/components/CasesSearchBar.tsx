import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface CasesSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CasesSearchBar({ value, onChange }: CasesSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search cases by any field..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
