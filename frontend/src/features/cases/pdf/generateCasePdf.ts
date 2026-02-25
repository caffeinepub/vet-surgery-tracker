import type { SurgeryCase } from '../../../backend';
import { formatDateForPdf, formatSpeciesForPdf, formatSexForPdf } from './pdfFormatters';
import { getRemainingChecklistItems } from '../checklist';

/**
 * Generates and downloads a PDF report of all surgery cases with remaining tasks.
 * Only includes cases that have at least one incomplete task.
 * Uses browser's native print functionality with landscape orientation.
 */
export function generateCasePdf(cases: SurgeryCase[]): void {
  // Filter to only cases with at least one remaining task
  const casesWithTasks = cases.filter(c => getRemainingChecklistItems(c.task).length > 0);

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Could not access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  const htmlContent = generateReportHtml(casesWithTasks);

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Error printing PDF:', error);
        document.body.removeChild(iframe);
      }
    }, 250);
  };
}

/**
 * Task color map for PDF badge styling
 */
const TASK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  dischargeNotes:  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  pdvmNotified:    { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  labs:            { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  histo:           { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  surgeryReport:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  imaging:         { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  culture:         { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

/**
 * Generates HTML content for the PDF report
 */
function generateReportHtml(cases: SurgeryCase[]): string {
  const generatedDate = new Date().toLocaleString();

  const tableRows = cases.map((caseItem, index) => {
    const remainingTasks = getRemainingChecklistItems(caseItem.task);
    const taskBadges = remainingTasks.map(t => {
      const colors = TASK_COLORS[t.key] ?? { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
      return `<span style="display:inline-block;margin:1px 2px;padding:2px 6px;border-radius:9999px;font-size:8pt;font-weight:600;background:${colors.bg};color:${colors.text};border:1px solid ${colors.border}">${escapeHtml(t.label)}</span>`;
    }).join('');

    const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="background:${rowBg}">
        <td style="font-weight:600">${escapeHtml(caseItem.medicalRecordNumber || '-')}</td>
        <td>${escapeHtml(caseItem.petName || '-')}</td>
        <td>${escapeHtml(caseItem.ownerLastName || '-')}</td>
        <td>${escapeHtml(formatSpeciesForPdf(caseItem.species))}</td>
        <td>${escapeHtml(caseItem.breed || '-')}</td>
        <td>${escapeHtml(formatSexForPdf(caseItem.sex))}</td>
        <td>${escapeHtml(formatDateForPdf(caseItem.arrivalDate))}</td>
        <td>${escapeHtml(caseItem.presentingComplaint || '-')}</td>
        <td>${taskBadges}</td>
      </tr>
    `;
  }).join('');

  const emptyMessage = cases.length === 0
    ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:#6b7280;font-style:italic;">No cases with outstanding tasks found.</td></tr>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>SurgiPaw — Outstanding Tasks Report</title>
      <style>
        @page {
          size: landscape;
          margin: 1.2cm 1cm;
        }

        * { box-sizing: border-box; }

        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 10pt;
          color: #1e293b;
        }

        .report-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #0ea5e9;
        }

        .report-title {
          font-size: 20pt;
          font-weight: 700;
          color: #0c4a6e;
          margin: 0 0 4px 0;
        }

        .report-subtitle {
          font-size: 10pt;
          color: #64748b;
          margin: 0;
        }

        .report-meta {
          text-align: right;
          font-size: 9pt;
          color: #64748b;
        }

        .summary-badge {
          display: inline-block;
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 9pt;
          font-weight: 600;
          margin-top: 4px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }

        thead tr {
          background: #0c4a6e;
        }

        th {
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 9pt;
          border: none;
          white-space: nowrap;
        }

        td {
          padding: 7px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 9pt;
          vertical-align: top;
        }

        .col-mrn { width: 8%; }
        .col-name { width: 9%; }
        .col-owner { width: 9%; }
        .col-species { width: 7%; }
        .col-breed { width: 10%; }
        .col-sex { width: 7%; }
        .col-arrival { width: 9%; }
        .col-complaint { width: 18%; }
        .col-tasks { width: 23%; }

        @media print {
          body { padding: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <div class="report-title">SurgiPaw</div>
          <div class="report-subtitle">Outstanding Tasks Report</div>
        </div>
        <div class="report-meta">
          <div>Generated: ${escapeHtml(generatedDate)}</div>
          <div class="summary-badge">${cases.length} case${cases.length !== 1 ? 's' : ''} with outstanding tasks</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-mrn">MRN</th>
            <th class="col-name">Pet Name</th>
            <th class="col-owner">Owner</th>
            <th class="col-species">Species</th>
            <th class="col-breed">Breed</th>
            <th class="col-sex">Sex</th>
            <th class="col-arrival">Arrival</th>
            <th class="col-complaint">Presenting Complaint</th>
            <th class="col-tasks">Outstanding Tasks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          ${emptyMessage}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
