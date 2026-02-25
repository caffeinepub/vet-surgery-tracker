import { useState, useEffect, useCallback } from 'react';
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
import { useCreateCase, useGetAllCases } from '../../../hooks/useQueries';
import type { SurgeryCase, Task } from '../../../backend';
import { Species, Sex } from '../../../backend';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import type { CaseFormData } from '../types';
import { getDefaultTaskSelections } from '../checklist';
import {
  validateMedicalRecordNumber,
  validatePetName,
  validateOwnerLastName,
  dateToNanoseconds,
  nanosecondsToDate,
} from '../validation';
import { parseStructuredText } from '../parsing/parseStructuredText';
import { toast } from 'sonner';
import DateField from './DateField';
import ChecklistEditor from './ChecklistEditor';
import { Mic, MicOff, Loader2, Wand2, ChevronDown } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseCreated?: (caseId: bigint) => void;
}

interface FormErrors {
  medicalRecordNumber?: string;
  arrivalDate?: string;
  petName?: string;
  ownerLastName?: string;
  species?: string;
  sex?: string;
}

const EMPTY_FORM: CaseFormData = {
  medicalRecordNumber: '',
  arrivalDate: new Date(),
  petName: '',
  ownerLastName: '',
  species: Species.canine,
  breed: '',
  sex: Sex.male,
  dateOfBirth: null,
  presentingComplaint: '',
  notes: '',
};

export default function CaseFormDialog({ open, onOpenChange, onCaseCreated }: CaseFormDialogProps) {
  const [form, setForm] = useState<CaseFormData>(EMPTY_FORM);
  const [task, setTask] = useState<Task>(getDefaultTaskSelections());
  const [errors, setErrors] = useState<FormErrors>({});
  const [quickFillText, setQuickFillText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showPreviousCases, setShowPreviousCases] = useState(false);

  const createCaseMutation = useCreateCase();
  const { data: allCases = [] } = useGetAllCases();

  // Speech recognition
  const {
    isRecording,
    isSupported: speechSupported,
    startRecording,
    stopRecording,
    transcript,
    resetTranscript,
  } = useSpeechRecognition();

  // When recording stops and transcript is available, put it in the quick fill box
  useEffect(() => {
    if (!isRecording && transcript.trim()) {
      setQuickFillText((prev) => (prev ? prev + ' ' + transcript : transcript));
      resetTranscript();
    }
  }, [isRecording, transcript, resetTranscript]);

  // Debounced values for searching previous cases
  const debouncedMRN = useDebouncedValue(form.medicalRecordNumber, 300);
  const debouncedPetName = useDebouncedValue(form.petName, 300);
  const debouncedOwner = useDebouncedValue(form.ownerLastName, 300);

  // Previous cases: search ALL cases (including completed) by MRN, pet name, owner
  const previousCases = useCallback((): SurgeryCase[] => {
    const mrn = debouncedMRN.trim().toLowerCase();
    const pet = debouncedPetName.trim().toLowerCase();
    const owner = debouncedOwner.trim().toLowerCase();

    if (!mrn && !pet && !owner) return [];

    const seen = new Set<string>();
    const results: SurgeryCase[] = [];

    // Search ALL cases — no completed-case filtering applied here
    for (const c of allCases as SurgeryCase[]) {
      if (seen.has(String(c.id))) continue;
      const matchMRN = mrn && c.medicalRecordNumber.toLowerCase().includes(mrn);
      const matchPet = pet && c.petName.toLowerCase().includes(pet);
      const matchOwner = owner && c.ownerLastName.toLowerCase().includes(owner);
      if (matchMRN || matchPet || matchOwner) {
        seen.add(String(c.id));
        results.push(c);
      }
    }

    return results.slice(0, 8);
  }, [debouncedMRN, debouncedPetName, debouncedOwner, allCases]);

  const prevCases = previousCases();
  const hasPrevCases = prevCases.length > 0;

  const handleFieldChange = <K extends keyof CaseFormData>(field: K, value: CaseFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleParseAndFill = () => {
    if (!quickFillText.trim()) {
      toast.error('Please enter text to parse');
      return;
    }
    setIsParsing(true);
    try {
      const parsed = parseStructuredText(quickFillText);
      setForm((prev) => ({
        ...prev,
        ...(parsed.medicalRecordNumber ? { medicalRecordNumber: parsed.medicalRecordNumber } : {}),
        ...(parsed.petName ? { petName: parsed.petName } : {}),
        ...(parsed.ownerLastName ? { ownerLastName: parsed.ownerLastName } : {}),
        ...(parsed.species ? { species: parsed.species } : {}),
        ...(parsed.breed ? { breed: parsed.breed } : {}),
        ...(parsed.sex ? { sex: parsed.sex } : {}),
        ...(parsed.arrivalDate ? { arrivalDate: parsed.arrivalDate } : {}),
        ...(parsed.dateOfBirth ? { dateOfBirth: parsed.dateOfBirth } : {}),
        ...(parsed.presentingComplaint ? { presentingComplaint: parsed.presentingComplaint } : {}),
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      }));
      toast.success('Fields filled from text');
    } catch (err) {
      toast.error('Failed to parse text');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectPreviousCase = (c: SurgeryCase) => {
    setForm((prev) => ({
      ...prev,
      medicalRecordNumber: c.medicalRecordNumber,
      petName: c.petName,
      ownerLastName: c.ownerLastName,
      species: c.species,
      breed: c.breed,
      sex: c.sex,
      dateOfBirth: c.dateOfBirth ? nanosecondsToDate(c.dateOfBirth) : null,
    }));
    setShowPreviousCases(false);
    toast.success('Fields prefilled from previous case');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const mrnError = validateMedicalRecordNumber(form.medicalRecordNumber);
    if (mrnError) newErrors.medicalRecordNumber = mrnError;

    if (!form.arrivalDate) newErrors.arrivalDate = 'Arrival date is required';

    const petNameError = validatePetName(form.petName);
    if (petNameError) newErrors.petName = petNameError;

    const ownerError = validateOwnerLastName(form.ownerLastName);
    if (ownerError) newErrors.ownerLastName = ownerError;

    if (!form.species) newErrors.species = 'Species is required';
    if (!form.sex) newErrors.sex = 'Sex is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const arrivalDateNs = dateToNanoseconds(form.arrivalDate!);
      const dateOfBirthNs = form.dateOfBirth ? dateToNanoseconds(form.dateOfBirth) : null;

      const newCase = await createCaseMutation.mutateAsync({
        medicalRecordNumber: form.medicalRecordNumber,
        arrivalDate: arrivalDateNs,
        petName: form.petName,
        ownerLastName: form.ownerLastName,
        species: form.species,
        breed: form.breed,
        sex: form.sex,
        dateOfBirth: dateOfBirthNs,
        presentingComplaint: form.presentingComplaint,
        notes: form.notes,
        taskOptions: {
          dischargeNotes: task.dischargeNotesSelected,
          pdvmNotified: task.pdvmNotifiedSelected,
          labs: task.labsSelected,
          histo: task.histoSelected,
          surgeryReport: task.surgeryReportSelected,
          imaging: task.imagingSelected,
          culture: task.cultureSelected,
        },
      });

      toast.success('Case created successfully');
      onCaseCreated?.(newCase.id);
      handleClose();
    } catch (err) {
      console.error('Failed to create case:', err);
      toast.error('Failed to create case. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setTask(getDefaultTaskSelections());
    setQuickFillText('');
    setErrors({});
    setShowPreviousCases(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setTask(getDefaultTaskSelections());
      setQuickFillText('');
      setErrors({});
      setShowPreviousCases(false);
    }
  }, [open]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Case</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Fill */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Fill</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder="Paste or dictate patient info here, then click Parse & Fill…"
                value={quickFillText}
                onChange={(e) => setQuickFillText(e.target.value)}
                className="min-h-[72px] text-sm resize-none"
              />
              {speechSupported && (
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="icon"
                  className="h-8 w-8 shrink-0 self-start"
                  onClick={handleToggleRecording}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleParseAndFill}
              disabled={!quickFillText.trim() || isParsing}
            >
              {isParsing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Parse & Fill
            </Button>
          </div>

          {/* Previous Cases — includes completed cases */}
          {hasPrevCases && (
            <div className="rounded-md border border-border bg-muted/40 p-2">
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full"
                onClick={() => setShowPreviousCases((v) => !v)}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showPreviousCases ? 'rotate-180' : ''}`}
                />
                {prevCases.length} previous case{prevCases.length !== 1 ? 's' : ''} found — click to prefill
              </button>
              {showPreviousCases && (
                <div className="mt-2 space-y-1">
                  {prevCases.map((c) => (
                    <button
                      key={String(c.id)}
                      type="button"
                      onClick={() => handleSelectPreviousCase(c)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    >
                      <span className="font-mono font-semibold text-primary">{c.medicalRecordNumber}</span>
                      {' — '}
                      <span className="font-medium">{c.petName}</span>
                      {' ('}
                      <span className="text-muted-foreground">{c.ownerLastName}</span>
                      {')'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            {/* MRN */}
            <div className="space-y-1">
              <Label htmlFor="mrn" className="text-xs">MRN *</Label>
              <Input
                id="mrn"
                value={form.medicalRecordNumber}
                onChange={(e) => handleFieldChange('medicalRecordNumber', e.target.value)}
                placeholder="e.g. 123456"
                className={`h-8 text-sm ${errors.medicalRecordNumber ? 'border-destructive' : ''}`}
              />
              {errors.medicalRecordNumber && (
                <p className="text-xs text-destructive">{errors.medicalRecordNumber}</p>
              )}
            </div>

            {/* Arrival Date */}
            <div className="space-y-1">
              <Label htmlFor="arrivalDate" className="text-xs">Arrival Date *</Label>
              <DateField
                id="arrivalDate"
                value={form.arrivalDate}
                onChange={(v) => handleFieldChange('arrivalDate', v)}
                className="h-8 text-sm"
              />
              {errors.arrivalDate && (
                <p className="text-xs text-destructive">{errors.arrivalDate}</p>
              )}
            </div>

            {/* Pet Name */}
            <div className="space-y-1">
              <Label htmlFor="petName" className="text-xs">Pet Name *</Label>
              <Input
                id="petName"
                value={form.petName}
                onChange={(e) => handleFieldChange('petName', e.target.value)}
                placeholder="e.g. Buddy"
                className={`h-8 text-sm ${errors.petName ? 'border-destructive' : ''}`}
              />
              {errors.petName && (
                <p className="text-xs text-destructive">{errors.petName}</p>
              )}
            </div>

            {/* Owner Last Name */}
            <div className="space-y-1">
              <Label htmlFor="ownerLastName" className="text-xs">Owner Last Name *</Label>
              <Input
                id="ownerLastName"
                value={form.ownerLastName}
                onChange={(e) => handleFieldChange('ownerLastName', e.target.value)}
                placeholder="e.g. Smith"
                className={`h-8 text-sm ${errors.ownerLastName ? 'border-destructive' : ''}`}
              />
              {errors.ownerLastName && (
                <p className="text-xs text-destructive">{errors.ownerLastName}</p>
              )}
            </div>

            {/* Species */}
            <div className="space-y-1">
              <Label className="text-xs">Species *</Label>
              <Select
                value={form.species}
                onValueChange={(v) => handleFieldChange('species', v as Species)}
              >
                <SelectTrigger className={`h-8 text-sm ${errors.species ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.species && (
                <p className="text-xs text-destructive">{errors.species}</p>
              )}
            </div>

            {/* Sex */}
            <div className="space-y-1">
              <Label className="text-xs">Sex *</Label>
              <Select
                value={form.sex}
                onValueChange={(v) => handleFieldChange('sex', v as Sex)}
              >
                <SelectTrigger className={`h-8 text-sm ${errors.sex ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  {SEX_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sex && (
                <p className="text-xs text-destructive">{errors.sex}</p>
              )}
            </div>

            {/* Breed */}
            <div className="space-y-1">
              <Label htmlFor="breed" className="text-xs">Breed</Label>
              <Input
                id="breed"
                value={form.breed}
                onChange={(e) => handleFieldChange('breed', e.target.value)}
                placeholder="e.g. Labrador"
                className="h-8 text-sm"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
              <DateField
                id="dateOfBirth"
                value={form.dateOfBirth}
                onChange={(v) => handleFieldChange('dateOfBirth', v)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Presenting Complaint */}
          <div className="space-y-1">
            <Label htmlFor="presentingComplaint" className="text-xs">Presenting Complaint</Label>
            <Input
              id="presentingComplaint"
              value={form.presentingComplaint}
              onChange={(e) => handleFieldChange('presentingComplaint', e.target.value)}
              placeholder="e.g. Routine spay"
              className="h-8 text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Additional notes…"
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* Tasks */}
          <div className="space-y-1">
            <Label className="text-xs">Tasks</Label>
            <ChecklistEditor
              task={task}
              onChange={setTask}
              mode="creation"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createCaseMutation.isPending}
            className="gap-1.5"
          >
            {createCaseMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
