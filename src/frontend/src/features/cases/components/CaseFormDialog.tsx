import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Sex, Species } from "../../../backend";
import WorkflowIcon from "../../../components/workflow-icons/WorkflowIcon";
import { useCreateCase } from "../../../hooks/useQueries";
import { CHECKLIST_ITEMS } from "../checklist";
import { parseStructuredText } from "../parsing/parseStructuredText";
import DateField from "./DateField";

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
  surgeryReport: false,
  imaging: false,
  culture: false,
  followUp: false,
  dailySummary: false,
};

const SPECIES_OPTIONS = [
  { value: Species.canine, label: "Canine" },
  { value: Species.feline, label: "Feline" },
  { value: Species.other, label: "Other" },
];

const SEX_OPTIONS = [
  { value: Sex.male, label: "Male" },
  { value: Sex.maleNeutered, label: "Male Neutered" },
  { value: Sex.female, label: "Female" },
  { value: Sex.femaleSpayed, label: "Female Spayed" },
];

// Map workflowType to TaskSelections key (only backend-supported tasks)
const WORKFLOW_TO_TASK_KEY: Record<string, keyof TaskSelections> = {
  dischargeNotes: "dischargeNotes",
  pdvmNotified: "pdvmNotified",
  labs: "labs",
  histo: "histo",
  surgeryReport: "surgeryReport",
  imaging: "imaging",
  culture: "culture",
  followUp: "followUp",
  dailySummary: "dailySummary",
};

// Human-readable field names for toast messages
const FIELD_LABELS: Record<string, string> = {
  medicalRecordNumber: "MRN",
  arrivalDate: "Arrival Date",
  petName: "Pet Name",
  ownerLastName: "Owner Last Name",
  species: "Species",
  breed: "Breed",
  sex: "Sex",
  dateOfBirth: "Date of Birth",
  presentingComplaint: "Presenting Complaint",
  notes: "Notes",
};

function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default function CaseFormDialog({
  open,
  onOpenChange,
}: CaseFormDialogProps) {
  const createCase = useCreateCase();

  const [mrn, setMrn] = useState("");
  const [arrivalDate, setArrivalDate] = useState<Date | null>(getTodayDate());
  const [petName, setPetName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [species, setSpecies] = useState<Species>(Species.canine);
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<Sex>(Sex.male);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [presentingComplaint, setPresentingComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [taskSelections, setTaskSelections] = useState<TaskSelections>(
    DEFAULT_TASK_SELECTIONS,
  );

  // AI paste-and-parse state
  const [pasteText, setPasteText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFields, setParsedFields] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setMrn("");
    setArrivalDate(getTodayDate());
    setPetName("");
    setOwnerLastName("");
    setSpecies(Species.canine);
    setBreed("");
    setSex(Sex.male);
    setDateOfBirth(null);
    setPresentingComplaint("");
    setNotes("");
    setTaskSelections(DEFAULT_TASK_SELECTIONS);
    setPasteText("");
    setParsedFields(new Set());
  };

  const dateToNanoseconds = (date: Date): bigint => {
    return BigInt(date.getTime()) * BigInt(1_000_000);
  };

  const handleParseText = async () => {
    if (!pasteText.trim()) {
      toast.error("Please paste some patient information first.");
      return;
    }

    setIsParsing(true);
    setParsedFields(new Set());

    try {
      // Small delay to show loading state (parsing is synchronous but fast)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const parsed = parseStructuredText(pasteText);
      const filledFields = new Set<string>();

      if (parsed.medicalRecordNumber) {
        setMrn(parsed.medicalRecordNumber);
        filledFields.add("medicalRecordNumber");
      }
      if (parsed.arrivalDate) {
        setArrivalDate(parsed.arrivalDate);
        filledFields.add("arrivalDate");
      }
      if (parsed.petName) {
        setPetName(parsed.petName);
        filledFields.add("petName");
      }
      if (parsed.ownerLastName) {
        setOwnerLastName(parsed.ownerLastName);
        filledFields.add("ownerLastName");
      }
      if (parsed.species) {
        setSpecies(parsed.species);
        filledFields.add("species");
      }
      if (parsed.breed) {
        setBreed(parsed.breed);
        filledFields.add("breed");
      }
      if (parsed.sex) {
        setSex(parsed.sex);
        filledFields.add("sex");
      }
      if (parsed.dateOfBirth) {
        setDateOfBirth(parsed.dateOfBirth);
        filledFields.add("dateOfBirth");
      }
      if (parsed.presentingComplaint) {
        setPresentingComplaint(parsed.presentingComplaint);
        filledFields.add("presentingComplaint");
      }
      if (parsed.notes) {
        setNotes(parsed.notes);
        filledFields.add("notes");
      }

      setParsedFields(filledFields);

      if (filledFields.size === 0) {
        toast.warning(
          'No fields could be parsed. Try using "Label: Value" format, e.g. "Patient Name: Buddy, Species: Canine"',
        );
      } else {
        const fieldNames = Array.from(filledFields)
          .map((f) => FIELD_LABELS[f] || f)
          .join(", ");
        toast.success(
          `Filled ${filledFields.size} field${filledFields.size > 1 ? "s" : ""}: ${fieldNames}`,
        );
      }
    } catch (_error) {
      toast.error(
        "Failed to parse the text. Please check the format and try again.",
      );
    } finally {
      setIsParsing(false);
    }
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
        dailySummary: taskSelections.dailySummary,
      },
    });

    resetForm();
    onOpenChange(false);
  };

  const toggleTask = (key: keyof TaskSelections) => {
    setTaskSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isFieldHighlighted = (field: string) => parsedFields.has(field);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Surgery Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI Paste & Parse Section */}
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <Label className="text-sm font-medium text-primary">
                Paste Patient Info
              </Label>
              <span className="text-xs text-muted-foreground">
                (optional — auto-fills fields below)
              </span>
            </div>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste patient information here and click "Parse". Supports formats like:\n• Patient Name: Buddy, MRN: 12345, Species: Canine, Breed: Labrador\n• Patient: Max\n  Species: Feline\n  Sex: Spayed Female`}
              className="min-h-[90px] text-sm resize-y bg-background"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleParseText}
                disabled={isParsing || !pasteText.trim()}
                className="flex items-center gap-1.5"
              >
                {isParsing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isParsing ? "Parsing…" : "Parse with AI"}
              </Button>
              {parsedFields.size > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {parsedFields.size} field{parsedFields.size > 1 ? "s" : ""}{" "}
                  filled
                </span>
              )}
              {pasteText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setPasteText("");
                    setParsedFields(new Set());
                  }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="mrn">Medical Record Number *</Label>
              <Input
                id="mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                required
                placeholder="e.g. MRN-001"
                className={
                  isFieldHighlighted("medicalRecordNumber")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="arrivalDate">Arrival Date *</Label>
              <div
                className={
                  isFieldHighlighted("arrivalDate")
                    ? "ring-2 ring-green-400/60 rounded-md"
                    : ""
                }
              >
                <DateField
                  id="arrivalDate"
                  value={arrivalDate}
                  onChange={setArrivalDate}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="petName">Pet Name *</Label>
              <Input
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                required
                placeholder="e.g. Buddy"
                className={
                  isFieldHighlighted("petName")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }
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
                className={
                  isFieldHighlighted("ownerLastName")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="species">Species *</Label>
              <select
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                className={`w-full border border-input rounded-md px-3 py-2 text-sm bg-background ${
                  isFieldHighlighted("species")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }`}
                required
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
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
                className={
                  isFieldHighlighted("breed")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sex">Sex *</Label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className={`w-full border border-input rounded-md px-3 py-2 text-sm bg-background ${
                  isFieldHighlighted("sex")
                    ? "ring-2 ring-green-400/60 border-green-400"
                    : ""
                }`}
                required
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <div
                className={
                  isFieldHighlighted("dateOfBirth")
                    ? "ring-2 ring-green-400/60 rounded-md"
                    : ""
                }
              >
                <DateField
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
            <Input
              id="presentingComplaint"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              placeholder="e.g. Limping on right front leg"
              className={
                isFieldHighlighted("presentingComplaint")
                  ? "ring-2 ring-green-400/60 border-green-400"
                  : ""
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className={`w-full border border-input rounded-md px-3 py-2 text-sm bg-background min-h-[80px] resize-y ${
                isFieldHighlighted("notes")
                  ? "ring-2 ring-green-400/60 border-green-400"
                  : ""
              }`}
            />
          </div>
          <div className="space-y-2">
            <Label>Tasks</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map((item) => {
                const key = WORKFLOW_TO_TASK_KEY[item.workflowType];
                if (!key) return null;
                return (
                  <div
                    key={item.workflowType}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`task-${item.workflowType}`}
                      checked={taskSelections[key]}
                      onCheckedChange={() => toggleTask(key)}
                    />
                    <Label
                      htmlFor={`task-${item.workflowType}`}
                      className="cursor-pointer font-normal flex items-center gap-1.5"
                    >
                      <span className="flex-shrink-0" style={{ lineHeight: 0 }}>
                        <WorkflowIcon workflowType={item.workflowType} />
                      </span>
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCase.isPending || !arrivalDate}
            >
              {createCase.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
