const fs = require('fs');
require('dotenv').config();
const { google } = require('googleapis');

const { months, incomeSheetName } = require('./constants');

const spreadsheetId = process.env.SPREADSHEET_ID;
let sheets;
let oAuth2Client;
const currentMonth = months[new Date().getMonth()];

const { bot } = require('../index');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

module.exports.authorize = function(msg) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    const { redirect_uris } = JSON.parse(content).installed;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
  
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(msg);
      oAuth2Client.setCredentials(JSON.parse(token));
      sheets = google.sheets({
        version: 'v4',
        auth: oAuth2Client,
      });
    });
  });
}

function getNewToken(msg, oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  bot.sendMessage(msg.chat.id, 'Authorize this app by visiting this url: ' + authUrl);
}

module.exports.createNewToken = function(code) {
  oAuth2Client.getToken(code, (err, token) => {
    if (err)
      return console.error(
        'Error while trying to retrieve access token',
        err
      );
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
  });
}

module.exports.addExpense = function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  sheets.spreadsheets.values.append(
    {
      spreadsheetId,
      range: currentMonth,
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
      range: `${incomeSheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      },
      // auth: process.env.GOOGLE_API_KEY
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
      range: `${currentMonth}!E2:E2`
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

module.exports.addSheet = function (onErr, onSuccess) {
  sheets.spreadsheets
    .batchUpdate({
      spreadsheetId,
      // auth: process.env.GOOGLE_API_KEY
    })
    .then((res) => void console.log(res))
    .catch((err) => console.log(err));
};
