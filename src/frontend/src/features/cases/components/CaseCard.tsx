import { useState } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../validation';
import { getRemainingItems } from '../checklist';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../types';
import { useDeleteCase } from '../../../hooks/useQueries';
import { toast } from 'sonner';
import CaseFormDialog from './CaseFormDialog';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
}

export default function CaseCard({ surgeryCase }: CaseCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteCase = useDeleteCase();

  const remainingItems = getRemainingItems(surgeryCase.checklist);
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

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow border-blue-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl text-blue-900 dark:text-blue-100 truncate">
                {surgeryCase.petName}
              </CardTitle>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                MR# {surgeryCase.medicalRecordNumber}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
              {speciesLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium">Owner</p>
              <p className="text-blue-900 dark:text-blue-100">{surgeryCase.ownerLastName}</p>
            </div>
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium">Sex</p>
              <p className="text-blue-900 dark:text-blue-100">{sexLabel}</p>
            </div>
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium">Breed</p>
              <p className="text-blue-900 dark:text-blue-100 truncate">{surgeryCase.breed}</p>
            </div>
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium">Arrival</p>
              <p className="text-blue-900 dark:text-blue-100">{formatDate(surgeryCase.arrivalDate)}</p>
            </div>
          </div>

          {surgeryCase.presentingComplaint && (
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">Presenting Complaint</p>
              <p className="text-blue-900 dark:text-blue-100 text-xs line-clamp-2">
                {surgeryCase.presentingComplaint}
              </p>
            </div>
          )}

          <div>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">Remaining Tasks</p>
            {remainingItems.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">All tasks completed</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {remainingItems.map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            <Edit className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900"
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
              disabled={deleteCase.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCase.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
