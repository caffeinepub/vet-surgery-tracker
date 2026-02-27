import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useCreateCase } from '../../../hooks/useQueries';
import { CHECKLIST_ITEMS } from '../checklist';
import { Species, Sex } from '../../../backend';
import DateField from './DateField';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TaskSelections {
  dischargeNotes: boolean;
  pdvmNotified: boolean;
  labs: boolean;
  histo: boolean;
  surgeryReport: boolean;
  imaging: boolean;
  culture: boolean;
  followUp: boolean;
  dailySummary: boolean;
}

const DEFAULT_TASK_SELECTIONS: TaskSelections = {
  dischargeNotes: true,
  pdvmNotified: true,
  labs: false,
  histo: false,
  surgeryReport: true,
  imaging: false,
  culture: false,
  followUp: false,
  dailySummary: false,
};

const SPECIES_OPTIONS = [
  { value: Species.canine, label: 'Canine' },
  { value: Species.feline, label: 'Feline' },
  { value: Species.other, label: 'Other' },
];

const SEX_OPTIONS = [
  { value: Sex.male, label: 'Male' },
  { value: Sex.maleNeutered, label: 'Male Neutered' },
  { value: Sex.female, label: 'Female' },
  { value: Sex.femaleSpayed, label: 'Female Spayed' },
];

// Map workflowType to TaskSelections key (only backend-supported tasks)
const WORKFLOW_TO_TASK_KEY: Record<string, keyof TaskSelections> = {
  dischargeNotes: 'dischargeNotes',
  pdvmNotified: 'pdvmNotified',
  labs: 'labs',
  histo: 'histo',
  surgeryReport: 'surgeryReport',
  imaging: 'imaging',
  culture: 'culture',
  followUp: 'followUp',
  dailySummary: 'dailySummary',
};

export default function CaseFormDialog({ open, onOpenChange }: CaseFormDialogProps) {
  const createCase = useCreateCase();

  const [mrn, setMrn] = useState('');
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [petName, setPetName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [species, setSpecies] = useState<Species>(Species.canine);
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Sex>(Sex.male);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [presentingComplaint, setPresentingComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [taskSelections, setTaskSelections] = useState<TaskSelections>(DEFAULT_TASK_SELECTIONS);

  const resetForm = () => {
    setMrn('');
    setArrivalDate(null);
    setPetName('');
    setOwnerLastName('');
    setSpecies(Species.canine);
    setBreed('');
    setSex(Sex.male);
    setDateOfBirth(null);
    setPresentingComplaint('');
    setNotes('');
    setTaskSelections(DEFAULT_TASK_SELECTIONS);
  };

  const dateToNanoseconds = (date: Date): bigint => {
    return BigInt(date.getTime()) * BigInt(1_000_000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalDate) return;

    await createCase.mutateAsync({
      medicalRecordNumber: mrn,
      arrivalDate: dateToNanoseconds(arrivalDate),
      petName,
      ownerLastName,
      species,
      breed,
      sex,
      dateOfBirth: dateOfBirth ? dateToNanoseconds(dateOfBirth) : null,
      presentingComplaint,
      notes,
      taskOptions: {
        dischargeNotes: taskSelections.dischargeNotes,
        pdvmNotified: taskSelections.pdvmNotified,
        labs: taskSelections.labs,
        histo: taskSelections.histo,
        surgeryReport: taskSelections.surgeryReport,
        imaging: taskSelections.imaging,
        culture: taskSelections.culture,
        followUp: taskSelections.followUp,
      },
    });

    resetForm();
    onOpenChange(false);
  };

  const toggleTask = (key: keyof TaskSelections) => {
    setTaskSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Surgery Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="mrn">Medical Record Number *</Label>
              <Input
                id="mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                required
                placeholder="e.g. MRN-001"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="arrivalDate">Arrival Date *</Label>
              <DateField
                id="arrivalDate"
                value={arrivalDate}
                onChange={setArrivalDate}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="petName">Pet Name *</Label>
              <Input
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                required
                placeholder="e.g. Buddy"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ownerLastName">Owner Last Name *</Label>
              <Input
                id="ownerLastName"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                required
                placeholder="e.g. Smith"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="species">Species *</Label>
              <select
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                required
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Labrador"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sex">Sex *</Label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                required
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DateField
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
            <Input
              id="presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              placeholder="e.g. Limping on right front leg"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background min-h-[80px] resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label>Tasks</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map((item) => {
                const key = WORKFLOW_TO_TASK_KEY[item.workflowType];
                if (!key) return null;
                return (
                  <div key={item.workflowType} className="flex items-center gap-2">
                    <Checkbox
                      id={`task-${item.workflowType}`}
                      checked={taskSelections[key]}
                      onCheckedChange={() => toggleTask(key)}
                    />
                    <Label htmlFor={`task-${item.workflowType}`} className="cursor-pointer font-normal">
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCase.isPending || !arrivalDate}>
              {createCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
