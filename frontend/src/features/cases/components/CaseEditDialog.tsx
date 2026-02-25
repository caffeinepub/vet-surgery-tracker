import { useState, useEffect } from 'react';
import type { SurgeryCase, Task } from '../../../backend';
import { Species, Sex } from '../../../backend';
import { useUpdateCase } from '../../../hooks/useQueries';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CHECKLIST_ITEMS } from '../checklist';

interface CaseEditDialogProps {
  surgeryCase: SurgeryCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function timeToDateString(time: bigint): string {
  const date = new Date(Number(time) / 1_000_000);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${y}`;
}

function dateStringToTime(dateStr: string): bigint | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return BigInt(date.getTime()) * 1_000_000n;
}

function getTaskBool(task: Task, field: keyof Task): boolean {
  return (task as unknown as Record<string, boolean>)[field as string] ?? false;
}

const emptyTask: Task = {
  dischargeNotesSelected: false,
  dischargeNotesCompleted: false,
  pdvmNotifiedSelected: false,
  pdvmNotifiedCompleted: false,
  labsSelected: false,
  labsCompleted: false,
  histoSelected: false,
  histoCompleted: false,
  surgeryReportSelected: false,
  surgeryReportCompleted: false,
  imagingSelected: false,
  imagingCompleted: false,
  cultureSelected: false,
  cultureCompleted: false,
};

export default function CaseEditDialog({ surgeryCase, open, onOpenChange }: CaseEditDialogProps) {
  const updateCase = useUpdateCase();

  const [medicalRecordNumber, setMedicalRecordNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [petName, setPetName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [species, setSpecies] = useState<Species>(Species.canine);
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Sex>(Sex.male);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [presentingComplaint, setPresentingComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [task, setTask] = useState<Task>(emptyTask);

  useEffect(() => {
    if (surgeryCase) {
      setMedicalRecordNumber(surgeryCase.medicalRecordNumber);
      setArrivalDate(timeToDateString(surgeryCase.arrivalDate));
      setPetName(surgeryCase.petName);
      setOwnerLastName(surgeryCase.ownerLastName);
      setSpecies(surgeryCase.species);
      setBreed(surgeryCase.breed);
      setSex(surgeryCase.sex);
      setDateOfBirth(surgeryCase.dateOfBirth ? timeToDateString(surgeryCase.dateOfBirth) : '');
      setPresentingComplaint(surgeryCase.presentingComplaint);
      setNotes(surgeryCase.notes);
      setTask(surgeryCase.task);
    }
  }, [surgeryCase]);

  const handleSave = async () => {
    if (!surgeryCase) return;

    const arrivalTime = dateStringToTime(arrivalDate);
    if (!arrivalTime) return;

    const dobTime = dateOfBirth ? dateStringToTime(dateOfBirth) : null;

    await updateCase.mutateAsync({
      id: surgeryCase.id,
      medicalRecordNumber,
      arrivalDate: arrivalTime,
      petName,
      ownerLastName,
      species,
      breed,
      sex,
      dateOfBirth: dobTime,
      presentingComplaint,
      notes,
      task,
    });

    onOpenChange(false);
  };

  const toggleTaskField = (field: keyof Task) => {
    setTask(prev => ({
      ...prev,
      [field]: !getTaskBool(prev, field),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* MRN */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-mrn">Medical Record #</Label>
            <Input
              id="edit-mrn"
              value={medicalRecordNumber}
              onChange={e => setMedicalRecordNumber(e.target.value)}
            />
          </div>

          {/* Arrival Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-arrival">Arrival Date (MM/DD/YYYY)</Label>
            <Input
              id="edit-arrival"
              value={arrivalDate}
              onChange={e => setArrivalDate(e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>

          {/* Pet Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-petname">Pet Name</Label>
            <Input
              id="edit-petname"
              value={petName}
              onChange={e => setPetName(e.target.value)}
            />
          </div>

          {/* Owner Last Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-owner">Owner Last Name</Label>
            <Input
              id="edit-owner"
              value={ownerLastName}
              onChange={e => setOwnerLastName(e.target.value)}
            />
          </div>

          {/* Species */}
          <div className="flex flex-col gap-1.5">
            <Label>Species</Label>
            <Select value={species} onValueChange={v => setSpecies(v as Species)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Species.canine}>
                  <span className="flex items-center gap-2">
                    <img src="/assets/Dog icon.ico" alt="Canine" className="w-4 h-4 object-contain" />
                    Canine
                  </span>
                </SelectItem>
                <SelectItem value={Species.feline}>
                  <span className="flex items-center gap-2">
                    <img src="/assets/Cat icon.ico" alt="Feline" className="w-4 h-4 object-contain" />
                    Feline
                  </span>
                </SelectItem>
                <SelectItem value={Species.other}>
                  <span className="flex items-center gap-2">
                    <img src="/assets/Other icon.ico" alt="Other" className="w-4 h-4 object-contain" />
                    Other
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sex */}
          <div className="flex flex-col gap-1.5">
            <Label>Sex</Label>
            <Select value={sex} onValueChange={v => setSex(v as Sex)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Sex.male}>Male</SelectItem>
                <SelectItem value={Sex.maleNeutered}>Male Neutered</SelectItem>
                <SelectItem value={Sex.female}>Female</SelectItem>
                <SelectItem value={Sex.femaleSpayed}>Female Spayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Breed */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-breed">Breed</Label>
            <Input
              id="edit-breed"
              value={breed}
              onChange={e => setBreed(e.target.value)}
            />
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-dob">Date of Birth (MM/DD/YYYY)</Label>
            <Input
              id="edit-dob"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>

          {/* Presenting Complaint */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="edit-complaint">Presenting Complaint</Label>
            <Input
              id="edit-complaint"
              value={presentingComplaint}
              onChange={e => setPresentingComplaint(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Tasks */}
          <div className="col-span-2 flex flex-col gap-2">
            <Label>Tasks</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map(item => {
                const isSelected = getTaskBool(task, item.selectedField);
                const isCompleted = getTaskBool(task, item.completedField);
                return (
                  <div key={item.key} className="flex items-center gap-3 p-2 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`sel-${item.key}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleTaskField(item.selectedField)}
                      />
                      <label htmlFor={`sel-${item.key}`} className="text-sm font-medium cursor-pointer">
                        {item.key}
                      </label>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Checkbox
                          id={`comp-${item.key}`}
                          checked={isCompleted}
                          onCheckedChange={() => toggleTaskField(item.completedField)}
                        />
                        <label htmlFor={`comp-${item.key}`} className="text-xs text-muted-foreground cursor-pointer">
                          Done
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCase.isPending}>
            {updateCase.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
