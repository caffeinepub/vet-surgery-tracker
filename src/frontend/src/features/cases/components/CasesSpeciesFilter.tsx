import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { SPECIES_OPTIONS } from '../types';
import type { Species } from '../../../backend';

interface CasesSpeciesFilterProps {
  selectedSpecies: Set<Species>;
  onSpeciesChange: (species: Set<Species>) => void;
}

const STORAGE_KEY = 'surgery-cases-species-filter';

export default function CasesSpeciesFilter({
  selectedSpecies,
  onSpeciesChange,
}: CasesSpeciesFilterProps) {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Species
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter by Species</h4>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-auto p-1 text-xs">
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {SPECIES_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`species-${option.value}`}
                  checked={selectedSpecies.has(option.value as Species)}
                  onCheckedChange={() => handleToggle(option.value as Species)}
                />
                <Label
                  htmlFor={`species-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
