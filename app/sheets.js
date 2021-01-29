require('dotenv').config();
const { google } = require('googleapis');

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY });

module.exports.addExpense = function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  sheets.spreadsheets.values.append(
    {
      spreadsheetId,
      range: 'Февраль',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      }
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res);
    }
  );
};

module.exports.addIncome = function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  sheets.spreadsheets.values.append(
    {
      spreadsheetId,
      range: 'Доход!A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      }
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res);
    }
  );
};

module.exports.getBalance = function (onErr, onSuccess) {
  sheets.spreadsheets.values.get(
    {
      spreadsheetId,
      range: 'Февраль!E2:E2'
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res.data.values[0][0]);
    }
  );
};
