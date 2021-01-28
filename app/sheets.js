const fs = require('fs');
const dotenv = require('dotenv');
const readline = require('readline');
const { google } = require('googleapis');

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';
let sheets;
const spreadsheetId = process.env.SPREADSHEET_ID;

fs.readFile('../credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), (auth) => {
    sheets = google.sheets({ version: 'v4', auth });
  });
});

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          'Error while trying to retrieve access token',
          err
        );
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

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
