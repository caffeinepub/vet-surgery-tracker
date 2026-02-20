import { useEffect, useState, useRef } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateCase, useUpdateCase, useGetCaseByMedicalRecordNumber } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import type { CaseFormData } from '../types';
import { getDefaultChecklist } from '../checklist';
import { dateToNanoseconds, nanosecondsToDate, validateMedicalRecordNumber, validatePetName, validateOwnerLastName, validateBreed } from '../validation';
import { parseStructuredText } from '../parsing/parseStructuredText';
import { toast } from 'sonner';
import DateField from './DateField';
import ChecklistEditor from './ChecklistEditor';
import type { Checklist } from '../../../backend';
import { ChevronDown, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCase?: SurgeryCase;
}

export default function CaseFormDialog({ open, onOpenChange, existingCase }: CaseFormDialogProps) {
  const isEditing = !!existingCase;
  const { actor, isFetching: actorFetching } = useActor();
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

  // Error state for detailed error display
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

  // Auto-prefill from matched case when MRN matches
  useEffect(() => {
    if (matchedCase && matchedCase.id !== lastPrefilledCaseId.current) {
      console.log('[CaseFormDialog] Auto-prefilling from matched case', {
        caseId: matchedCase.id,
        mrn: matchedCase.medicalRecordNumber,
      });

      lastPrefilledCaseId.current = matchedCase.id;

      // Only prefill fields that haven't been manually edited
      const fieldsToUpdate: Array<{ field: string; setter: (value: any) => void; value: any }> = [];

      if (!editedFields.has('petName')) {
        fieldsToUpdate.push({ field: 'petName', setter: setPetName, value: matchedCase.petName });
      }
      if (!editedFields.has('ownerLastName')) {
        fieldsToUpdate.push({ field: 'ownerLastName', setter: setOwnerLastName, value: matchedCase.ownerLastName });
      }
      if (!editedFields.has('species')) {
        fieldsToUpdate.push({ field: 'species', setter: setSpecies, value: matchedCase.species });
      }
      if (!editedFields.has('breed')) {
        fieldsToUpdate.push({ field: 'breed', setter: setBreed, value: matchedCase.breed });
      }
      if (!editedFields.has('sex')) {
        fieldsToUpdate.push({ field: 'sex', setter: setSex, value: matchedCase.sex });
      }
      if (!editedFields.has('dateOfBirth') && matchedCase.dateOfBirth) {
        fieldsToUpdate.push({
          field: 'dateOfBirth',
          setter: setDateOfBirth,
          value: nanosecondsToDate(matchedCase.dateOfBirth),
        });
      }

      // Apply all updates
      fieldsToUpdate.forEach(({ setter, value }) => setter(value));

      if (fieldsToUpdate.length > 0) {
        toast.success(`Auto-filled ${fieldsToUpdate.length} field${fieldsToUpdate.length > 1 ? 's' : ''} from existing case`);
      }
    }
  }, [matchedCase, editedFields]);

  // Initialize form with existing case data when editing
  useEffect(() => {
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
    }
  }, [existingCase]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      if (!isEditing) {
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
        setStructuredText('');
        setIsParseOpen(false);
      }
      setErrorDetails(null);
      setEditedFields(new Set());
      lastPrefilledCaseId.current = null;
    }
  }, [open, isEditing]);

  const markFieldAsEdited = (fieldName: string) => {
    setEditedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleQuickFill = () => {
    if (!structuredText.trim()) {
      toast.error('Please enter text to parse');
      return;
    }

    setIsParsing(true);
    console.log('[CaseFormDialog] Parsing structured text', {
      textLength: structuredText.length,
      timestamp: new Date().toISOString(),
    });

    try {
      const parsed = parseStructuredText(structuredText);
      console.log('[CaseFormDialog] Parsed data', { parsed });

      let appliedCount = 0;

      // Only update fields that haven't been manually edited
      if (parsed.medicalRecordNumber && !editedFields.has('medicalRecordNumber')) {
        setMedicalRecordNumber(parsed.medicalRecordNumber);
        appliedCount++;
      }

      if (parsed.petName && !editedFields.has('petName')) {
        setPetName(parsed.petName);
        appliedCount++;
      }

      if (parsed.ownerLastName && !editedFields.has('ownerLastName')) {
        setOwnerLastName(parsed.ownerLastName);
        appliedCount++;
      }

      if (parsed.species && !editedFields.has('species')) {
        setSpecies(parsed.species);
        appliedCount++;
      }

      if (parsed.breed && !editedFields.has('breed')) {
        setBreed(parsed.breed);
        appliedCount++;
      }

      if (parsed.sex && !editedFields.has('sex')) {
        setSex(parsed.sex);
        appliedCount++;
      }

      if (parsed.arrivalDate && !editedFields.has('arrivalDate')) {
        setArrivalDate(parsed.arrivalDate);
        appliedCount++;
      }

      if (parsed.dateOfBirth && !editedFields.has('dateOfBirth')) {
        setDateOfBirth(parsed.dateOfBirth);
        appliedCount++;
      }

      if (parsed.presentingComplaint && !editedFields.has('presentingComplaint')) {
        setPresentingComplaint(parsed.presentingComplaint);
        appliedCount++;
      }

      if (appliedCount > 0) {
        toast.success(`Filled ${appliedCount} field${appliedCount > 1 ? 's' : ''} from text`);
        setIsParseOpen(false);
        setStructuredText('');
      } else {
        toast.info('No new fields to fill', {
          description: 'All extracted fields were already filled.',
        });
      }
    } catch (error) {
      console.error('[CaseFormDialog] Error parsing text', { error });
      toast.error('Failed to parse text', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    // Check if actor is available
    if (!actor || actorFetching) {
      const errorMsg = 'Backend connection not ready. Please wait a moment and try again.';
      setErrorDetails(errorMsg);
      toast.error('Connection Error', { description: errorMsg });
      return;
    }

    // Validate required fields
    const mrnError = validateMedicalRecordNumber(medicalRecordNumber);
    if (mrnError) {
      setErrorDetails(`Medical Record Number: ${mrnError}`);
      toast.error('Validation Error', { description: mrnError });
      return;
    }

    const petNameError = validatePetName(petName);
    if (petNameError) {
      setErrorDetails(`Pet Name: ${petNameError}`);
      toast.error('Validation Error', { description: petNameError });
      return;
    }

    const ownerError = validateOwnerLastName(ownerLastName);
    if (ownerError) {
      setErrorDetails(`Owner Last Name: ${ownerError}`);
      toast.error('Validation Error', { description: ownerError });
      return;
    }

    const breedError = validateBreed(breed);
    if (breedError) {
      setErrorDetails(`Breed: ${breedError}`);
      toast.error('Validation Error', { description: breedError });
      return;
    }

    if (!arrivalDate) {
      setErrorDetails('Arrival Date is required');
      toast.error('Validation Error', { description: 'Arrival Date is required' });
      return;
    }

    try {
      const arrivalDateNs = dateToNanoseconds(arrivalDate);
      const dateOfBirthNs = dateOfBirth ? dateToNanoseconds(dateOfBirth) : null;

      if (isEditing && existingCase) {
        await updateCase.mutateAsync({
          id: existingCase.id,
          medicalRecordNumber,
          arrivalDate: arrivalDateNs,
          petName,
          ownerLastName,
          species: species as any,
          breed,
          sex: sex as any,
          dateOfBirth: dateOfBirthNs,
          presentingComplaint,
          notes,
          checklist,
        });
        toast.success('Case updated successfully');
      } else {
        await createCase.mutateAsync({
          medicalRecordNumber,
          arrivalDate: arrivalDateNs,
          petName,
          ownerLastName,
          species: species as any,
          breed,
          sex: sex as any,
          dateOfBirth: dateOfBirthNs,
          presentingComplaint,
          notes,
          checklist,
        });
        toast.success('Case created successfully');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('[CaseFormDialog] Error saving case', { error });
      const errorMessage = error?.message || 'Failed to save case';
      setErrorDetails(errorMessage);
      toast.error('Error', { description: errorMessage });
    }
  };

  const isAutoFilled = (fieldName: string) => {
    return !editedFields.has(fieldName) && (matchedCase !== null || matchedCase !== undefined);
  };

  const actorReady = !!actor && !actorFetching;
  const isSubmitting = createCase.isPending || updateCase.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-popover">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Case' : 'Create New Case'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the case information below.' : 'Fill in the case details. Use Quick Fill for faster data entry.'}
          </DialogDescription>
        </DialogHeader>

        {!actorReady && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Connecting to backend...</AlertTitle>
            <AlertDescription>
              Please wait while we establish a connection. The form will be ready in a moment.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Actions */}
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsParseOpen(!isParseOpen)}
                className="flex-1"
                disabled={!actorReady}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Fill
              </Button>
            </div>
          )}

          {/* Quick Fill Collapsible */}
          {!isEditing && (
            <Collapsible open={isParseOpen} onOpenChange={setIsParseOpen}>
              <CollapsibleContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="structuredText">Paste Case Information</Label>
                  <Textarea
                    id="structuredText"
                    value={structuredText}
                    onChange={(e) => setStructuredText(e.target.value)}
                    placeholder="Paste case information here (e.g., from a document or email)&#10;&#10;Example:&#10;MRN: 12345&#10;Pet Name: Max&#10;Owner: Smith&#10;Species: Canine&#10;..."
                    rows={6}
                    className="font-mono text-sm"
                    disabled={!actorReady}
                  />
                </div>
                <Button type="button" onClick={handleQuickFill} disabled={isParsing || !actorReady} className="w-full">
                  {isParsing ? 'Parsing...' : 'Parse and Fill Fields'}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Error Display */}
          {errorDetails && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorDetails}</AlertDescription>
            </Alert>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medicalRecordNumber">
                Medical Record Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="medicalRecordNumber"
                value={medicalRecordNumber}
                onChange={(e) => {
                  setMedicalRecordNumber(e.target.value);
                  markFieldAsEdited('medicalRecordNumber');
                }}
                required
                disabled={!actorReady}
                className={cn(isAutoFilled('medicalRecordNumber') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalDate">
                Arrival Date <span className="text-destructive">*</span>
              </Label>
              <DateField
                value={arrivalDate}
                onChange={(date) => {
                  setArrivalDate(date);
                  markFieldAsEdited('arrivalDate');
                }}
                disabled={!actorReady}
                className={cn(isAutoFilled('arrivalDate') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="petName">
                Pet Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="petName"
                value={petName}
                onChange={(e) => {
                  setPetName(e.target.value);
                  markFieldAsEdited('petName');
                }}
                required
                disabled={!actorReady}
                className={cn(isAutoFilled('petName') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerLastName">
                Owner Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ownerLastName"
                value={ownerLastName}
                onChange={(e) => {
                  setOwnerLastName(e.target.value);
                  markFieldAsEdited('ownerLastName');
                }}
                required
                disabled={!actorReady}
                className={cn(isAutoFilled('ownerLastName') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="species">
                Species <span className="text-destructive">*</span>
              </Label>
              <Select
                value={species}
                onValueChange={(value) => {
                  setSpecies(value);
                  markFieldAsEdited('species');
                }}
                disabled={!actorReady}
              >
                <SelectTrigger
                  id="species"
                  className={cn(isAutoFilled('species') && 'bg-blue-50 dark:bg-blue-950')}
                >
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
              <Label htmlFor="breed">
                Breed <span className="text-destructive">*</span>
              </Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => {
                  setBreed(e.target.value);
                  markFieldAsEdited('breed');
                }}
                required
                disabled={!actorReady}
                className={cn(isAutoFilled('breed') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sex">
                Sex <span className="text-destructive">*</span>
              </Label>
              <Select
                value={sex}
                onValueChange={(value) => {
                  setSex(value);
                  markFieldAsEdited('sex');
                }}
                disabled={!actorReady}
              >
                <SelectTrigger
                  id="sex"
                  className={cn(isAutoFilled('sex') && 'bg-blue-50 dark:bg-blue-950')}
                >
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
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DateField
                value={dateOfBirth}
                onChange={(date) => {
                  setDateOfBirth(date);
                  markFieldAsEdited('dateOfBirth');
                }}
                disabled={!actorReady}
                className={cn(isAutoFilled('dateOfBirth') && 'bg-blue-50 dark:bg-blue-950')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
            <Textarea
              id="presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => {
                setPresentingComplaint(e.target.value);
                markFieldAsEdited('presentingComplaint');
              }}
              rows={3}
              disabled={!actorReady}
              className={cn(isAutoFilled('presentingComplaint') && 'bg-blue-50 dark:bg-blue-950')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={!actorReady}
            />
          </div>

          <div className="space-y-2">
            <Label>Checklist</Label>
            <ChecklistEditor
              checklist={checklist}
              onChange={setChecklist}
              disabled={!actorReady}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!actorReady || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update Case' : 'Create Case'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
