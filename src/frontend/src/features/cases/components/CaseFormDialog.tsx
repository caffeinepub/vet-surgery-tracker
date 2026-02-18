import { useEffect, useState } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCase, useUpdateCase } from '../../../hooks/useQueries';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import { getDefaultChecklist } from '../checklist';
import { dateToNanoseconds, nanosecondsToDate, validateMedicalRecordNumber, validatePetName, validateOwnerLastName, validateBreed } from '../validation';
import { toast } from 'sonner';
import DateField from './DateField';
import ChecklistEditor from './ChecklistEditor';
import type { Checklist } from '../../../backend';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCase?: SurgeryCase;
}

export default function CaseFormDialog({ open, onOpenChange, existingCase }: CaseFormDialogProps) {
  const isEditing = !!existingCase;
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();

  const [medicalRecordNumber, setMedicalRecordNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState<Date | null>(new Date());
  const [petName, setPetName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [species, setSpecies] = useState<string>('canine');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<string>('male');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [presentingComplaint, setPresentingComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Checklist>(getDefaultChecklist());

  useEffect(() => {
    if (open) {
      if (existingCase) {
        setMedicalRecordNumber(existingCase.medicalRecordNumber);
        setArrivalDate(nanosecondsToDate(existingCase.arrivalDate));
        setPetName(existingCase.petName);
        setOwnerLastName(existingCase.ownerLastName);
        setSpecies(existingCase.species);
        setBreed(existingCase.breed);
        setSex(existingCase.sex);
        setDateOfBirth(existingCase.dateOfBirth ? nanosecondsToDate(existingCase.dateOfBirth) : null);
        setPresentingComplaint(existingCase.presentingComplaint);
        setNotes(existingCase.notes);
        setChecklist(existingCase.checklist);
      } else {
        setMedicalRecordNumber('');
        setArrivalDate(new Date());
        setPetName('');
        setOwnerLastName('');
        setSpecies('canine');
        setBreed('');
        setSex('male');
        setDateOfBirth(null);
        setPresentingComplaint('');
        setNotes('');
        setChecklist(getDefaultChecklist());
      }
    }
  }, [open, existingCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mrnError = validateMedicalRecordNumber(medicalRecordNumber);
    if (mrnError) {
      toast.error(mrnError);
      return;
    }

    const petNameError = validatePetName(petName);
    if (petNameError) {
      toast.error(petNameError);
      return;
    }

    const ownerError = validateOwnerLastName(ownerLastName);
    if (ownerError) {
      toast.error(ownerError);
      return;
    }

    const breedError = validateBreed(breed);
    if (breedError) {
      toast.error(breedError);
      return;
    }

    if (!arrivalDate) {
      toast.error('Arrival date is required');
      return;
    }

    try {
      if (isEditing) {
        await updateCase.mutateAsync({
          id: existingCase.id,
          medicalRecordNumber,
          petName,
          ownerLastName,
          species: species as any,
          breed,
          sex: sex as any,
          dateOfBirth: dateOfBirth ? dateToNanoseconds(dateOfBirth) : null,
          presentingComplaint,
          notes,
          checklist,
        });
        toast.success('Case updated successfully');
      } else {
        await createCase.mutateAsync({
          medicalRecordNumber,
          petName,
          ownerLastName,
          species: species as any,
          breed,
          sex: sex as any,
          dateOfBirth: dateOfBirth ? dateToNanoseconds(dateOfBirth) : null,
          presentingComplaint,
          notes,
          checklist,
        });
        toast.success('Case created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update case' : 'Failed to create case');
      console.error('Form submission error:', error);
    }
  };

  const isPending = createCase.isPending || updateCase.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900 dark:text-blue-100">
            {isEditing ? 'Edit Case' : 'New Case'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the case information below.' : 'Fill in the details to create a new surgery case.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicalRecordNumber">Medical Record #</Label>
              <Input
                id="medicalRecordNumber"
                value={medicalRecordNumber}
                onChange={(e) => setMedicalRecordNumber(e.target.value)}
                placeholder="Enter medical record number"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Arrival Date</Label>
              <DateField
                id="arrivalDate"
                value={arrivalDate}
                onChange={setArrivalDate}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="petName">Pet Name</Label>
              <Input
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter pet name"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerLastName">Owner Last Name</Label>
              <Input
                id="ownerLastName"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                placeholder="Enter owner last name"
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Select value={species} onValueChange={setSpecies} disabled={isPending}>
                <SelectTrigger id="species">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Enter breed"
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select value={sex} onValueChange={setSex} disabled={isPending}>
                <SelectTrigger id="sex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEX_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
              <DateField
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
            <Textarea
              id="presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              placeholder="Enter presenting complaint"
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter additional notes"
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>To-Do Checklist</Label>
            <ChecklistEditor value={checklist} onChange={setChecklist} disabled={isPending} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Case' : 'Create Case')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
