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

import {generatePdfs as generatePdfsFn} from './pdf-service';

/**
 * Top-level wrapper so Apps Script can find this function by name from the menu.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- called by Apps Script runtime
function generatePdfs() {
  generatePdfsFn();
}

/**
 * Adds a custom menu to the Google Sheets UI when the spreadsheet is opened.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- called by Apps Script runtime
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Generate Pdf')
    .addItem('Generate PDFs from Responses', 'generatePdfs')
    .addSeparator()
    .addItem('Set Template Document', 'setTemplateDocument')
    .addToUi();
}

/**
 * Prompts the user to set or update the template document ID,
 * then stores it in Script Properties for reuse.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- called by Apps Script runtime
function setTemplateDocument() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const currentId = properties.getProperty('TEMPLATE_DOC_ID');

  let promptText =
    'Please enter the Google Docs Template Document ID.\n\n' +
    'You can find this in the document URL:\n' +
    'https://docs.google.com/document/d/<DOCUMENT_ID>/edit';
  if (currentId) {
    promptText += `\n\nCurrent template ID: ${currentId}`;
  }

  const response = ui.prompt(
    'Set Template Document',
    promptText,
    ui.ButtonSet.OK_CANCEL,
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const templateId = response.getResponseText().trim();
  if (!templateId) {
    ui.alert('Error', 'Template ID cannot be empty.', ui.ButtonSet.OK);
    return;
  }

  try {
    // Validate that the document exists and is accessible
    DriveApp.getFileById(templateId);
    properties.setProperty('TEMPLATE_DOC_ID', templateId);
    ui.alert(
      'Success',
      `Template document saved.\nID: ${templateId}`,
      ui.ButtonSet.OK,
    );
  } catch (e) {
    ui.alert(
      'Error',
      `Could not access document with ID "${templateId}".\n\n` +
        'Make sure the ID is correct and the document is accessible by this script.\n\n' +
        `Error: ${e}`,
      ui.ButtonSet.OK,
    );
  }
}
