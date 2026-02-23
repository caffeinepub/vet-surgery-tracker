import { useEffect, useState, useRef } from 'react';
import type { SurgeryCase, Task } from '../../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateCase, useUpdateCase, useGetCaseByMedicalRecordNumber } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import type { CaseFormData } from '../types';
import { getDefaultTaskSelections } from '../checklist';
import { dateToNanoseconds, nanosecondsToDate, validateMedicalRecordNumber, validatePetName, validateOwnerLastName, validateBreed } from '../validation';
import { parseStructuredText } from '../parsing/parseStructuredText';
import { toast } from 'sonner';
import DateField from './DateField';
import ChecklistEditor from './ChecklistEditor';
import { Sparkles, AlertCircle, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  
  // Task selection state - initialized with defaults
  const [task, setTask] = useState<Task>(getDefaultTaskSelections());

  // AI parsing state
  const [structuredText, setStructuredText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Error state for detailed error display
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Track which fields have been edited by the user in this dialog session
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // Refs for date field auto-advance
  const arrivalDateRef = useRef<HTMLInputElement>(null);
  const petNameRef = useRef<HTMLInputElement>(null);

  // Speech recognition hook
  const {
    isRecording,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSpeechRecognition();

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

  // Handle transcript changes - when recording stops and transcript is available
  useEffect(() => {
    if (!isRecording && transcript.trim()) {
      console.log('[CaseFormDialog] Voice recording stopped, transcript available:', transcript);
      
      // Replace the text in the Quick Fill box
      setStructuredText(transcript);
      
      // Automatically parse the transcript
      handleQuickFill(transcript);
      
      // Reset the transcript for next recording
      resetTranscript();
    }
  }, [isRecording, transcript]);

  // Show speech recognition errors
  useEffect(() => {
    if (speechError) {
      toast.error('Voice Recording Error', {
        description: speechError,
      });
    }
  }, [speechError]);

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
      setTask(existingCase.task);
    }
  }, [existingCase]);

  // Reset form when dialog closes or after successful creation
  const resetForm = () => {
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
    setTask(getDefaultTaskSelections());
    setStructuredText('');
    setErrorDetails(null);
    setEditedFields(new Set());
    lastPrefilledCaseId.current = null;
    resetTranscript();
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      if (!isEditing) {
        resetForm();
      } else {
        setErrorDetails(null);
        setEditedFields(new Set());
        lastPrefilledCaseId.current = null;
        resetTranscript();
      }
    }
  }, [open, isEditing]);

  const markFieldAsEdited = (fieldName: string) => {
    setEditedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleQuickFill = (textToParse?: string) => {
    const text = textToParse || structuredText;
    
    if (!text.trim()) {
      toast.error('Please enter text to parse');
      return;
    }

    setIsParsing(true);
    console.log('[CaseFormDialog] Parsing structured text', {
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    try {
      const parsed = parseStructuredText(text);
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
        toast.success(`Filled ${appliedCount} field${appliedCount > 1 ? 's' : ''} from ${textToParse ? 'voice' : 'text'}`);
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

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
        // When editing, use the current task state as-is
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
          task,
        });
        toast.success('Case updated successfully');
      } else {
        // When creating, convert Task to TaskOptions and ensure all *Completed fields are false
        const taskOptions = {
          dischargeNotes: task.dischargeNotesSelected,
          pdvmNotified: task.pdvmNotifiedSelected,
          labs: task.labsSelected,
          histo: task.histoSelected,
          surgeryReport: task.surgeryReportSelected,
          imaging: task.imagingSelected,
          culture: task.cultureSelected,
        };

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
          taskOptions,
        });
        toast.success('Case created successfully');
        
        // Reset form after successful creation
        resetForm();
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
          {/* Quick Fill Section - Always Visible */}
          {!isEditing && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Quick Fill from Text</Label>
                </div>
                <Button
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={!actorReady || !isSpeechSupported}
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="sm"
                  className={cn(
                    'transition-all',
                    isRecording && 'animate-pulse'
                  )}
                  title={!isSpeechSupported ? 'Voice recording not supported in this browser' : isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Voice
                    </>
                  )}
                </Button>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Recording... Click "Stop" when finished
                </div>
              )}
              <Textarea
                placeholder="Paste case information here or use voice recording..."
                value={structuredText}
                onChange={(e) => setStructuredText(e.target.value)}
                className="min-h-[100px]"
                disabled={!actorReady || isRecording}
              />
              <Button
                type="button"
                onClick={() => handleQuickFill()}
                disabled={!structuredText.trim() || isParsing || !actorReady}
                className="w-full"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse and Fill
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {errorDetails && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorDetails}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrn">Medical Record Number *</Label>
                <Input
                  id="mrn"
                  value={medicalRecordNumber}
                  onChange={(e) => {
                    setMedicalRecordNumber(e.target.value);
                    markFieldAsEdited('medicalRecordNumber');
                  }}
                  placeholder="e.g., MRN12345"
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('medicalRecordNumber') && 'bg-blue-50 dark:bg-blue-950')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Arrival Date *</Label>
                <DateField
                  id="arrivalDate"
                  value={arrivalDate}
                  onChange={(date) => {
                    setArrivalDate(date);
                    markFieldAsEdited('arrivalDate');
                  }}
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('arrivalDate') && 'bg-blue-50 dark:bg-blue-950')}
                  onComplete={() => {
                    // Auto-advance to pet name field
                    if (petNameRef.current) {
                      petNameRef.current.focus();
                    }
                  }}
                  inputRef={arrivalDateRef}
                />
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="petName">Pet Name *</Label>
                <Input
                  ref={petNameRef}
                  id="petName"
                  value={petName}
                  onChange={(e) => {
                    setPetName(e.target.value);
                    markFieldAsEdited('petName');
                  }}
                  placeholder="e.g., Max"
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('petName') && 'bg-blue-50 dark:bg-blue-950')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerLastName">Owner Last Name *</Label>
                <Input
                  id="ownerLastName"
                  value={ownerLastName}
                  onChange={(e) => {
                    setOwnerLastName(e.target.value);
                    markFieldAsEdited('ownerLastName');
                  }}
                  placeholder="e.g., Smith"
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('ownerLastName') && 'bg-blue-50 dark:bg-blue-950')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Select
                  value={species}
                  onValueChange={(value) => {
                    setSpecies(value);
                    markFieldAsEdited('species');
                  }}
                  disabled={!actorReady || isSubmitting}
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
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  value={breed}
                  onChange={(e) => {
                    setBreed(e.target.value);
                    markFieldAsEdited('breed');
                  }}
                  placeholder="e.g., Labrador Retriever"
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('breed') && 'bg-blue-50 dark:bg-blue-950')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <Select
                  value={sex}
                  onValueChange={(value) => {
                    setSex(value);
                    markFieldAsEdited('sex');
                  }}
                  disabled={!actorReady || isSubmitting}
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
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(date) => {
                    setDateOfBirth(date);
                    markFieldAsEdited('dateOfBirth');
                  }}
                  disabled={!actorReady || isSubmitting}
                  className={cn(isAutoFilled('dateOfBirth') && 'bg-blue-50 dark:bg-blue-950')}
                />
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Clinical Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
              <Textarea
                id="presentingComplaint"
                value={presentingComplaint}
                onChange={(e) => {
                  setPresentingComplaint(e.target.value);
                  markFieldAsEdited('presentingComplaint');
                }}
                placeholder="Brief description of the reason for visit"
                className={cn(
                  'min-h-[80px]',
                  isAutoFilled('presentingComplaint') && 'bg-blue-50 dark:bg-blue-950'
                )}
                disabled={!actorReady || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or observations"
                className="min-h-[80px]"
                disabled={!actorReady || isSubmitting}
              />
            </div>
          </div>

          {/* Task Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <ChecklistEditor
              task={task}
              onChange={setTask}
              mode={isEditing ? 'completion' : 'creation'}
              disabled={!actorReady || isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!actorReady || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
