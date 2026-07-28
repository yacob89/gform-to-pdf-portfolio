/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Column mapping for the form response sheet.
 * Adjust these indices to match your actual sheet layout (0-based).
 *
 * By default, Google Forms response sheets have:
 *   Col A (0): Timestamp
 *   Col B (1): Document Id
 *   Col C (2): Date
 *   Col D (3): Client Name
 *   Col E (4): Company Name
 *   Col F (5): Address
 */
interface ColumnMapping {
  documentId: number;
  date: number;
  clientName: number;
  companyName: number;
  address: number;
}

const DEFAULT_COLUMNS: ColumnMapping = {
  documentId: 1,
  date: 2,
  clientName: 3,
  companyName: 4,
  address: 5,
};

/**
 * Placeholder keys used in the Google Docs template.
 */
const PLACEHOLDER_MAP: Record<keyof ColumnMapping, string> = {
  documentId: '{{DocumentId}}',
  date: '{{Date}}',
  clientName: '{{ClientName}}',
  companyName: '{{CompanyName}}',
  address: '{{Address}}',
};

/**
 * Main entry point called from the custom menu.
 * Reads form responses from the active sheet, fills the template,
 * and generates PDFs into a dedicated folder.
 */
export function generatePdfs() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const templateId = properties.getProperty('TEMPLATE_DOC_ID');

  if (!templateId) {
    ui.alert(
      'No Template Set',
      'Please set a template document first via "Generate Pdf > Set Template Document".',
      ui.ButtonSet.OK,
    );
    return;
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length < 2) {
    ui.alert(
      'No Data',
      'No form responses found in the active sheet.',
      ui.ButtonSet.OK,
    );
    return;
  }

  // Detect columns from the header row (first row)
  const headers = values[0] as string[];
  const columns = detectColumns(headers);

  // Collect rows that have a Document Id filled in
  const rows: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const docId = String(values[i][columns.documentId] ?? '').trim();
    if (docId) {
      rows.push(i);
    }
  }

  if (rows.length === 0) {
    ui.alert(
      'No Records',
      'No form responses with a Document Id found. Make sure the Document Id column is filled.',
      ui.ButtonSet.OK,
    );
    return;
  }

  // Ask user how many to process
  const response = ui.prompt(
    'Generate PDFs',
    `Found ${rows.length} record(s) with a Document Id.\n` +
      'Enter the number of records to process (starting from the first):\n' +
      '(Leave blank or enter "all" to process all)',
    ui.ButtonSet.OK_CANCEL,
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim().toLowerCase();
  let countToProcess = rows.length;
  if (input && input !== 'all') {
    const parsed = parseInt(input, 10);
    if (isNaN(parsed) || parsed < 1) {
      ui.alert(
        'Invalid Input',
        'Please enter a valid positive number or "all".',
        ui.ButtonSet.OK,
      );
      return;
    }
    countToProcess = Math.min(parsed, rows.length);
  }

  const rowsToProcess = rows.slice(0, countToProcess);

  // Create or find the output folder
  const folder = getOrCreateOutputFolder(sheet.getName());

  let successCount = 0;
  const errors: string[] = [];

  for (const rowIndex of rowsToProcess) {
    const row = values[rowIndex];
    try {
      const record = extractRecord(row, columns);
      const pdfFile = createPdfFromTemplate(templateId, record, folder);
      // Write the PDF URL back to the sheet in the next available column
      writePdfUrl(sheet, rowIndex, pdfFile.getUrl());
      successCount++;
    } catch (e) {
      errors.push(`Row ${rowIndex + 1}: ${e}`);
    }
  }

  // Show summary
  let message = `Processed ${successCount} of ${rowsToProcess.length} record(s).`;
  if (errors.length > 0) {
    message += '\n\nErrors:\n' + errors.join('\n');
  }

  ui.alert('PDF Generation Complete', message, ui.ButtonSet.OK);
}

/**
 * Attempts to detect column indices by matching header names.
 * Falls back to DEFAULT_COLUMNS if headers don't match.
 */
function detectColumns(headers: string[]): ColumnMapping {
  const headerLower = headers.map(h => String(h).toLowerCase().trim());

  const findIndex = (keywords: string[]): number => {
    for (const keyword of keywords) {
      const idx = headerLower.findIndex(h => h.includes(keyword));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const detected: Partial<ColumnMapping> = {};

  const docIdIdx = findIndex(['document id', 'documentid', 'doc id', 'docid']);
  if (docIdIdx !== -1) detected.documentId = docIdIdx;

  const dateIdx = findIndex(['date']);
  if (dateIdx !== -1) detected.date = dateIdx;

  const clientIdx = findIndex(['client name', 'clientname', 'client']);
  if (clientIdx !== -1) detected.clientName = clientIdx;

  const companyIdx = findIndex(['company name', 'companyname', 'company']);
  if (companyIdx !== -1) detected.companyName = companyIdx;

  const addressIdx = findIndex(['address']);
  if (addressIdx !== -1) detected.address = addressIdx;

  // Merge detected with defaults (detected values override defaults)
  return {...DEFAULT_COLUMNS, ...detected};
}

/**
 * Extracts a record from a sheet row using the column mapping.
 */
function extractRecord(
  row: unknown[],
  columns: ColumnMapping,
): Record<string, string> {
  return {
    documentId: String(row[columns.documentId] ?? '').trim(),
    date: String(row[columns.date] ?? '').trim(),
    clientName: String(row[columns.clientName] ?? '').trim(),
    companyName: String(row[columns.companyName] ?? '').trim(),
    address: String(row[columns.address] ?? '').trim(),
  };
}

/**
 * Creates a PDF from the template document by replacing placeholders
 * with the record data.
 */
function createPdfFromTemplate(
  templateId: string,
  record: Record<string, string>,
  parentFolder: GoogleAppsScript.Drive.Folder,
): GoogleAppsScript.Drive.File {
  // Make a copy of the template document
  const templateFile = DriveApp.getFileById(templateId);
  const copyName = `PDF_${record.documentId}_${record.clientName || 'NoName'}`;
  const copyFile = templateFile.makeCopy(copyName, parentFolder);

  // Open the copy as a Document and replace placeholders
  const doc = DocumentApp.openById(copyFile.getId());
  const body = doc.getBody();

  for (const [key, placeholder] of Object.entries(PLACEHOLDER_MAP)) {
    const value = record[key] || '';
    body.replaceText(placeholder, value);
  }

  doc.saveAndClose();

  // Convert to PDF
  const pdfBlob = copyFile.getAs('application/pdf');
  const pdfFile = parentFolder.createFile(pdfBlob).setName(copyName + '.pdf');

  // Remove the intermediate Doc copy (keep only the PDF)
  copyFile.setTrashed(true);

  return pdfFile;
}

/**
 * Gets or creates the output folder for PDFs.
 * Folder is named "PDFs - <SheetName>" and lives in the root of the
 * script's Drive.
 */
function getOrCreateOutputFolder(
  sheetName: string,
): GoogleAppsScript.Drive.Folder {
  const folderName = `PDFs - ${sheetName}`;
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

/**
 * Writes the PDF URL into the sheet at the first empty column after the data range.
 */
function writePdfUrl(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  rowIndex: number,
  pdfUrl: string,
): void {
  const lastColumn = sheet.getLastColumn();
  const headerCell = sheet.getRange(1, lastColumn + 1);

  // Check if the header already has "PDF URL" or similar
  const currentHeader = String(headerCell.getValue() ?? '')
    .trim()
    .toLowerCase();
  if (!currentHeader.includes('pdf')) {
    headerCell.setValue('PDF URL');
  }

  // Write the URL in the same column for this row
  sheet.getRange(rowIndex + 1, lastColumn + 1).setValue(pdfUrl);
}
