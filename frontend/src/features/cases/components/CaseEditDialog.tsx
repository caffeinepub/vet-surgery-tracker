import React, { useState, useEffect } from 'react';
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
import { useUpdateCase } from '../../../hooks/useQueries';
import { SurgeryCase, Species, Sex, Task } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';
import DateField from './DateField';

interface CaseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surgeryCase: SurgeryCase;
}

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

function bigintToDate(time: bigint | undefined | null): Date | null {
  if (!time) return null;
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return null;
  return date;
}

function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export default function CaseEditDialog({ open, onOpenChange, surgeryCase }: CaseEditDialogProps) {
  const updateCase = useUpdateCase();

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
  const [taskState, setTaskState] = useState<Task>(surgeryCase.task);

  useEffect(() => {
    if (open && surgeryCase) {
      setMrn(surgeryCase.medicalRecordNumber);
      setArrivalDate(bigintToDate(surgeryCase.arrivalDate));
      setPetName(surgeryCase.petName);
      setOwnerLastName(surgeryCase.ownerLastName);
      setSpecies(surgeryCase.species);
      setBreed(surgeryCase.breed);
      setSex(surgeryCase.sex);
      setDateOfBirth(bigintToDate(surgeryCase.dateOfBirth));
      setPresentingComplaint(surgeryCase.presentingComplaint);
      setNotes(surgeryCase.notes);
      setTaskState(surgeryCase.task);
    }
  }, [open, surgeryCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalDate) return;

    await updateCase.mutateAsync({
      id: surgeryCase.id,
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
      task: taskState,
    });

    onOpenChange(false);
  };

  const toggleTaskSelected = (selectedField: keyof Task) => {
    setTaskState((prev) => ({
      ...prev,
      [selectedField]: !prev[selectedField],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Surgery Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-mrn">Medical Record Number *</Label>
              <Input
                id="edit-mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-arrivalDate">Arrival Date *</Label>
              <DateField
                id="edit-arrivalDate"
                value={arrivalDate}
                onChange={setArrivalDate}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-petName">Pet Name *</Label>
              <Input
                id="edit-petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-ownerLastName">Owner Last Name *</Label>
              <Input
                id="edit-ownerLastName"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-species">Species *</Label>
              <select
                id="edit-species"
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
              <Label htmlFor="edit-breed">Breed</Label>
              <Input
                id="edit-breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-sex">Sex *</Label>
              <select
                id="edit-sex"
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
              <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
              <DateField
                id="edit-dateOfBirth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-presentingComplaint">Presenting Complaint</Label>
            <Input
              id="edit-presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background min-h-[80px] resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label>Tasks</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map((item) => {
                // Skip dailySummary since backend doesn't support it yet
                if (item.workflowType === 'dailySummary') return null;
                const isSelected = taskState[item.selectedField] === true;
                return (
                  <div key={item.workflowType} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-task-${item.workflowType}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleTaskSelected(item.selectedField)}
                    />
                    <Label htmlFor={`edit-task-${item.workflowType}`} className="cursor-pointer font-normal">
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCase.isPending || !arrivalDate}>
              {updateCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
