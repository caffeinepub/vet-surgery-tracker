import { useEffect, useState, useRef } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCreateCase, useUpdateCase, useGetCaseByMedicalRecordNumber } from '../../../hooks/useQueries';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import { getDefaultChecklist } from '../checklist';
import { dateToNanoseconds, nanosecondsToDate, validateMedicalRecordNumber, validatePetName, validateOwnerLastName, validateBreed } from '../validation';
import { parseStructuredText } from '../parsing/parseStructuredText';
import { toast } from 'sonner';
import DateField from './DateField';
import ChecklistEditor from './ChecklistEditor';
import type { Checklist } from '../../../backend';
import { ChevronDown, Sparkles } from 'lucide-react';

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

  // AI parsing state
  const [structuredText, setStructuredText] = useState('');
  const [isParseOpen, setIsParseOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Track which fields have been edited by the user in this dialog session
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // Debounce the MRN input for lookup
  const debouncedMRN = useDebouncedValue(medicalRecordNumber, 500);

  // Only enable MRN lookup when creating a new case (not editing)
  const { data: matchedCase } = useGetCaseByMedicalRecordNumber(
    debouncedMRN,
    !isEditing && debouncedMRN.trim().length > 0
  );

  // Track if we've already prefilled from this matched case
  const lastPrefilledCaseId = useRef<bigint | null>(null);

  useEffect(() => {
    if (open) {
      // Reset edited fields tracking when dialog opens
      setEditedFields(new Set());
      lastPrefilledCaseId.current = null;
      setStructuredText('');
      setIsParseOpen(false);

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

  // Auto-prefill from matched case when creating a new case
  useEffect(() => {
    if (!isEditing && matchedCase && matchedCase.id !== lastPrefilledCaseId.current) {
      lastPrefilledCaseId.current = matchedCase.id;

      // Only prefill fields that haven't been edited by the user
      if (!editedFields.has('petName')) {
        setPetName(matchedCase.petName);
      }
      if (!editedFields.has('ownerLastName')) {
        setOwnerLastName(matchedCase.ownerLastName);
      }
      if (!editedFields.has('species')) {
        setSpecies(matchedCase.species);
      }
      if (!editedFields.has('breed')) {
        setBreed(matchedCase.breed);
      }
      if (!editedFields.has('sex')) {
        setSex(matchedCase.sex);
      }
      if (!editedFields.has('dateOfBirth')) {
        setDateOfBirth(matchedCase.dateOfBirth ? nanosecondsToDate(matchedCase.dateOfBirth) : null);
      }
      if (!editedFields.has('presentingComplaint')) {
        setPresentingComplaint(matchedCase.presentingComplaint);
      }
      if (!editedFields.has('notes')) {
        setNotes(matchedCase.notes);
      }
      // Note: We explicitly do NOT prefill arrivalDate from the matched case
    }
  }, [matchedCase, isEditing, editedFields]);

  const markFieldAsEdited = (fieldName: string) => {
    setEditedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleParseAndAutofill = () => {
    if (!structuredText.trim()) {
      toast.error('Please paste case information to parse');
      return;
    }

    setIsParsing(true);

    try {
      const parsed = parseStructuredText(structuredText);
      let fieldsPopulated = 0;

      // Apply parsed values only to fields that haven't been manually edited
      if (parsed.medicalRecordNumber && !editedFields.has('medicalRecordNumber')) {
        setMedicalRecordNumber(parsed.medicalRecordNumber);
        fieldsPopulated++;
      }

      if (parsed.arrivalDate && !editedFields.has('arrivalDate')) {
        setArrivalDate(parsed.arrivalDate);
        fieldsPopulated++;
      }

      if (parsed.petName && !editedFields.has('petName')) {
        setPetName(parsed.petName);
        fieldsPopulated++;
      }

      if (parsed.ownerLastName && !editedFields.has('ownerLastName')) {
        setOwnerLastName(parsed.ownerLastName);
        fieldsPopulated++;
      }

      if (parsed.species && !editedFields.has('species')) {
        setSpecies(parsed.species);
        fieldsPopulated++;
      }

      if (parsed.breed && !editedFields.has('breed')) {
        setBreed(parsed.breed);
        fieldsPopulated++;
      }

      if (parsed.sex && !editedFields.has('sex')) {
        setSex(parsed.sex);
        fieldsPopulated++;
      }

      if (parsed.dateOfBirth && !editedFields.has('dateOfBirth')) {
        setDateOfBirth(parsed.dateOfBirth);
        fieldsPopulated++;
      }

      if (parsed.presentingComplaint && !editedFields.has('presentingComplaint')) {
        setPresentingComplaint(parsed.presentingComplaint);
        fieldsPopulated++;
      }

      if (fieldsPopulated === 0) {
        toast.error('No valid fields found in the pasted text');
      } else {
        toast.success(`${fieldsPopulated} field${fieldsPopulated > 1 ? 's' : ''} populated successfully`);
        setIsParseOpen(false);
      }
    } catch (error) {
      console.error('Parsing error:', error);
      toast.error('Failed to parse case information');
    } finally {
      setIsParsing(false);
    }
  };

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
          arrivalDate: dateToNanoseconds(arrivalDate),
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
          arrivalDate: dateToNanoseconds(arrivalDate),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-popover">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Case' : 'New Case'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the case information below.' : 'Fill in the details to create a new surgery case.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI Parsing Section - Only show when creating new case */}
          {!isEditing && (
            <Collapsible open={isParseOpen} onOpenChange={setIsParseOpen}>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full flex items-center justify-between p-0 hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Quick Fill from Text</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isParseOpen ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Paste case information in the format: <span className="font-mono">MRN: value, Arrival date: value, Pet Name: value</span>, etc.
                  </p>
                  <Textarea
                    value={structuredText}
                    onChange={(e) => setStructuredText(e.target.value)}
                    placeholder="MRN: 12345&#10;Arrival date: 2/18/2026&#10;Pet Name: Buddy&#10;Owner name: Smith&#10;Species: Canine&#10;Sex: Male Neutered&#10;Breed: Golden Retriever&#10;DOB: 1/15/2016&#10;Presenting Complaint: Torn ACL"
                    rows={6}
                    className="font-mono text-xs"
                    disabled={isParsing}
                  />
                  <Button
                    type="button"
                    onClick={handleParseAndAutofill}
                    disabled={isParsing || !structuredText.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {isParsing ? 'Parsing...' : 'Parse & Auto-fill'}
                  </Button>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicalRecordNumber">Medical Record #</Label>
              <Input
                id="medicalRecordNumber"
                value={medicalRecordNumber}
                onChange={(e) => {
                  setMedicalRecordNumber(e.target.value);
                  markFieldAsEdited('medicalRecordNumber');
                }}
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
                onChange={(date) => {
                  setArrivalDate(date);
                  markFieldAsEdited('arrivalDate');
                }}
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
                onChange={(e) => {
                  setPetName(e.target.value);
                  markFieldAsEdited('petName');
                }}
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
                onChange={(e) => {
                  setOwnerLastName(e.target.value);
                  markFieldAsEdited('ownerLastName');
                }}
                placeholder="Enter owner last name"
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Select
                value={species}
                onValueChange={(value) => {
                  setSpecies(value);
                  markFieldAsEdited('species');
                }}
                disabled={isPending}
              >
                <SelectTrigger id="species">
                  <SelectValue placeholder="Select species" />
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
                onChange={(e) => {
                  setBreed(e.target.value);
                  markFieldAsEdited('breed');
                }}
                placeholder="Enter breed"
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={sex}
                onValueChange={(value) => {
                  setSex(value);
                  markFieldAsEdited('sex');
                }}
                disabled={isPending}
              >
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select sex" />
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
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DateField
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={(date) => {
                  setDateOfBirth(date);
                  markFieldAsEdited('dateOfBirth');
                }}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
            <Input
              id="presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => {
                setPresentingComplaint(e.target.value);
                markFieldAsEdited('presentingComplaint');
              }}
              placeholder="Enter presenting complaint"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markFieldAsEdited('notes');
              }}
              placeholder="Enter additional notes"
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Checklist</Label>
            <ChecklistEditor
              value={checklist}
              onChange={setChecklist}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update Case' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
