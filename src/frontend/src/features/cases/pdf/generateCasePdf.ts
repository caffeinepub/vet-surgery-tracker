import type { SurgeryCase } from '../../../backend';
import { formatDateForPdf, formatSpeciesForPdf, formatSexForPdf, formatRemainingTasksForPdf } from './pdfFormatters';
import { getRemainingChecklistItems } from '../checklist';

/**
 * Generates and downloads a PDF report of all surgery cases with their remaining tasks
 * Uses browser's native print functionality to create PDF without external dependencies
 */
export function generateCasePdf(cases: SurgeryCase[]): void {
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

  // Generate HTML content for the report
  const htmlContent = generateReportHtml(cases);
  
  // Write content to iframe
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for content to load, then trigger print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after a delay to allow print dialog to open
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
 * Generates HTML content for the PDF report
 */
function generateReportHtml(cases: SurgeryCase[]): string {
  const generatedDate = new Date().toLocaleString();
  
  const tableRows = cases.map(caseItem => {
    const remainingTasks = getRemainingChecklistItems(caseItem.task);
    const tasksList = remainingTasks.map(t => t.label);
    
    return `
      <tr>
        <td>${escapeHtml(caseItem.medicalRecordNumber || '-')}</td>
        <td>${escapeHtml(caseItem.petName || '-')}</td>
        <td>${escapeHtml(caseItem.ownerLastName || '-')}</td>
        <td>${escapeHtml(formatSpeciesForPdf(caseItem.species))}</td>
        <td>${escapeHtml(caseItem.breed || '-')}</td>
        <td>${escapeHtml(formatSexForPdf(caseItem.sex))}</td>
        <td>${escapeHtml(formatDateForPdf(caseItem.arrivalDate))}</td>
        <td>${escapeHtml(caseItem.presentingComplaint || '-')}</td>
        <td>${escapeHtml(formatRemainingTasksForPdf(tasksList))}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Surgery Cases Report</title>
      <style>
        @page {
          size: landscape;
          margin: 1cm;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 10pt;
        }
        
        h1 {
          font-size: 18pt;
          margin: 0 0 5px 0;
          color: #2c3e50;
        }
        
        .meta {
          font-size: 9pt;
          color: #666;
          margin-bottom: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th {
          background-color: #2980b9;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #2980b9;
          font-size: 9pt;
        }
        
        td {
          padding: 6px 8px;
          border: 1px solid #ddd;
          font-size: 9pt;
          vertical-align: top;
        }
        
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        tr:hover {
          background-color: #e8f4f8;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <h1>Surgery Cases Report</h1>
      <div class="meta">Generated: ${escapeHtml(generatedDate)}</div>
      
      <table>
        <thead>
          <tr>
            <th>MRN</th>
            <th>Pet Name</th>
            <th>Owner</th>
            <th>Species</th>
            <th>Breed</th>
            <th>Sex</th>
            <th>Arrival Date</th>
            <th>Presenting Complaint</th>
            <th>Remaining Tasks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
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
