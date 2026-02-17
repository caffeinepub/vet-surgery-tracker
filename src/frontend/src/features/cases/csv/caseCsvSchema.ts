export const CSV_HEADERS = [
  'Medical Record #',
  'Arrival Date',
  'Pet Name',
  'Owner Last Name',
  'Species',
  'Breed',
  'Sex',
  'Date of Birth',
  'Presenting Complaint',
  'Notes',
  'Discharge Notes',
  'pDVM Notified',
  'Labs',
  'Histo',
  'Surgery Report',
  'Imaging',
  'Culture',
] as const;

export type CsvRow = {
  'Medical Record #': string;
  'Arrival Date': string;
  'Pet Name': string;
  'Owner Last Name': string;
  'Species': string;
  'Breed': string;
  'Sex': string;
  'Date of Birth': string;
  'Presenting Complaint': string;
  'Notes': string;
  'Discharge Notes': string;
  'pDVM Notified': string;
  'Labs': string;
  'Histo': string;
  'Surgery Report': string;
  'Imaging': string;
  'Culture': string;
};
