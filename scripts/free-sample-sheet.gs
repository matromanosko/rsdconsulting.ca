// Google Apps Script for the "Free sample requests" sheet. Deployed as a web
// app, its URL goes in LEADS_WEBHOOK_URL; requestSample (app/examples/actions.ts)
// POSTs each lead as JSON and this appends it as a row.
//
// Setup: in the sheet, Extensions > Apps Script, paste this file, then
// Deploy > New deployment > Web app, execute as "Me", access "Anyone".

const HEADERS = ["Submitted at", "Name", "Email", "Phone", "Company", "Data sources", "Other source"];

function doPost(e) {
  const lead = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  sheet.appendRow([
    new Date(lead.submittedAt),
    lead.name,
    lead.email,
    // leading apostrophe keeps "+1 514…" from being read as a formula
    "'" + lead.phone,
    lead.company,
    (lead.sources || []).join(", "),
    lead.otherSource || "",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Run this from the editor to check the sheet setup; running doPost directly
// fails because there is no request.
function testDoPost() {
  doPost({ postData: { contents: JSON.stringify({
    submittedAt: new Date().toISOString(),
    name: "Test Lead", email: "test@example.com", phone: "+1 514 555 0100",
    company: "Test Co", sources: ["ezFocus", "Other"], otherSource: "Excel",
  }) } });
}
