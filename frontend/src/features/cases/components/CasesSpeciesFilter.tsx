import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import type { Species } from '../../../backend';
import { Species as SpeciesEnum } from '../../../backend';

interface CasesSpeciesFilterProps {
  selectedSpecies: Set<Species>;
  onSpeciesChange: (species: Set<Species>) => void;
}

const STORAGE_KEY = 'surgery-cases-species-filter';

const SPECIES_OPTIONS = [
  { value: SpeciesEnum.canine, label: 'Canine', icon: '/assets/Dog icon.ico' },
  { value: SpeciesEnum.feline, label: 'Feline', icon: '/assets/Cat icon.ico' },
  { value: SpeciesEnum.other, label: 'Other', icon: '/assets/Other icon.ico' },
];

export default function CasesSpeciesFilter({ selectedSpecies, onSpeciesChange }: CasesSpeciesFilterProps) {
  const [open, setOpen] = useState(false);

  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Species[];
        onSpeciesChange(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse stored species filter:', e);
      }
    }
  }, []);

  // Save to session storage when changed
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedSpecies)));
  }, [selectedSpecies]);

  const handleToggle = (species: Species) => {
    const newSet = new Set(selectedSpecies);
    if (newSet.has(species)) {
      newSet.delete(species);
    } else {
      newSet.add(species);
    }
    onSpeciesChange(newSet);
  };

  const handleClear = () => {
    onSpeciesChange(new Set());
  };

  const activeCount = selectedSpecies.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Species
          {activeCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          {SPECIES_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedSpecies.has(opt.value)}
                onCheckedChange={() => handleToggle(opt.value)}
              />
              <img src={opt.icon} alt={opt.label} className="w-5 h-5 object-contain" />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClear}
            className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center"
          >
            Clear filters
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
