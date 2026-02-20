import { useState } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDate, calculateAge } from '../validation';
import { getRemainingItems } from '../checklist';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import { useDeleteCase, useUpdateCompletedTasks } from '../../../hooks/useQueries';
import { toast } from 'sonner';
import CaseFormDialog from './CaseFormDialog';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
}

export default function CaseCard({ surgeryCase }: CaseCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteCase = useDeleteCase();
  const updateCompletedTasks = useUpdateCompletedTasks();

  const remainingItems = getRemainingItems(surgeryCase.completedTasks);
  const speciesLabel = SPECIES_OPTIONS.find((opt) => opt.value === surgeryCase.species)?.label || surgeryCase.species;
  const sexLabel = SEX_OPTIONS.find((opt) => opt.value === surgeryCase.sex)?.label || surgeryCase.sex;

  const handleDelete = async () => {
    try {
      await deleteCase.mutateAsync(surgeryCase.id);
      toast.success('Case deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete case');
      console.error('Delete error:', error);
    }
  };

  const handleTaskToggle = async (taskKey: keyof typeof surgeryCase.completedTasks) => {
    try {
      const updatedCompletedTasks = {
        ...surgeryCase.completedTasks,
        [taskKey]: true,
      };
      await updateCompletedTasks.mutateAsync({
        id: surgeryCase.id,
        completedTasks: updatedCompletedTasks,
      });
      toast.success('Task completed');
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Update error:', error);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-xl truncate flex-1" style={{ color: 'oklch(var(--patient-name))' }}>
              {surgeryCase.petName}
            </CardTitle>
            <p className="text-sm text-muted-foreground shrink-0">
              {formatDate(surgeryCase.arrivalDate)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              MR# {surgeryCase.medicalRecordNumber}
            </p>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary border-2 border-primary/40 text-sm font-medium">
              {speciesLabel}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground font-medium">Owner</p>
              <p className="text-foreground">{surgeryCase.ownerLastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Sex</p>
              <p className="text-foreground">{sexLabel}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground font-medium">Breed</p>
              <p className="text-foreground">{surgeryCase.breed}</p>
            </div>
            {surgeryCase.dateOfBirth && (
              <>
                <div>
                  <p className="text-muted-foreground font-medium">Date of Birth</p>
                  <p className="text-foreground">{formatDate(surgeryCase.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Age</p>
                  <p className="text-foreground">{calculateAge(surgeryCase.dateOfBirth)}</p>
                </div>
              </>
            )}
          </div>

          {surgeryCase.presentingComplaint && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Presenting Complaint</p>
              <div 
                className="p-3 rounded-md border-2" 
                style={{ 
                  backgroundColor: 'oklch(var(--complaint-bg))',
                  borderColor: 'oklch(var(--complaint-border))',
                  color: 'oklch(var(--complaint-text))'
                }}
              >
                <p className="text-xs line-clamp-2">
                  {surgeryCase.presentingComplaint}
                </p>
              </div>
            </div>
          )}

          {surgeryCase.notes && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Notes</p>
              <div className="p-3 rounded-md border-2 border-muted bg-muted/50">
                <p className="text-foreground text-xs line-clamp-3">
                  {surgeryCase.notes}
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-muted-foreground font-medium mb-2">Remaining Tasks</p>
            {remainingItems.length === 0 ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">All tasks completed</span>
              </div>
            ) : (
              <div className="space-y-2">
                {remainingItems.map((item) => {
                  const isHisto = item.label === 'Histo';
                  const isImaging = item.label === 'Imaging';
                  
                  return (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${surgeryCase.id}-${item.key}`}
                        checked={false}
                        onCheckedChange={() => handleTaskToggle(item.key)}
                        disabled={updateCompletedTasks.isPending}
                      />
                      <Label
                        htmlFor={`task-${surgeryCase.id}-${item.key}`}
                        className={`text-sm font-normal cursor-pointer ${
                          isHisto
                            ? 'px-2 py-0.5 border-2 border-purple-500 rounded bg-purple-100 text-purple-700 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-300'
                            : isImaging
                            ? 'px-2 py-0.5 border-2 border-primary/60 rounded bg-primary/10 text-primary'
                            : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex-1"
          >
            <Edit className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 dark:border-destructive dark:text-destructive dark:hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <CaseFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        existingCase={surgeryCase}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the case for <strong>{surgeryCase.petName}</strong> (MR# {surgeryCase.medicalRecordNumber})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteCase.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
