const fs = require('fs');
require('dotenv').config();
const { google } = require('googleapis');

const { months, incomeSheetName } = require('./constants');

const spreadsheetId = process.env.SPREADSHEET_ID;
let sheets;
let authClient;
const currentMonth = months[new Date().getMonth()];

const { bot } = require('../index');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

module.exports.authorize = function (msg) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    const { redirect_uris } = JSON.parse(content).installed;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    authClient = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(msg, authClient);
      authClient.setCredentials(JSON.parse(token));
      sheets = google.sheets({
        version: 'v4',
        auth: authClient
      });
    });
  });
};

function getNewToken(msg, oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  bot.sendMessage(
    msg.chat.id,
    'Authorize this app by visiting this url: ' + authUrl
  );
}

module.exports.createNewToken = function (code) {
  authClient.getToken(code, (err, token) => {
    if (err)
      return console.error('Error while trying to retrieve access token', err);
    authClient.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
  });
};

function fulfillSheet(range, onErr, onSuccess) {
 sheets.spreadsheets.values.append(
   {
     range,
     spreadsheetId,
     valueInputOption: 'USER_ENTERED',
     insertDataOption: 'OVERWRITE',
     requestBody: {
       values: [
        ['Дата операции', 'Сумма',	'Категория', 'Описание', 'Остаток']
       ]
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
}

module.exports.addExpense = async function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: currentMonth,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      }
    });
    onSuccess(res);
  } catch (error) {
    onErr(error);
  }
};

module.exports.addIncome = async function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  try {
    const res = sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${incomeSheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      },
    });
    onSuccess(res);
  } catch (error) {
    onErr(error);
  }
};

module.exports.getBalance = async function(onErr, onSuccess) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${currentMonth}!E2:E2`,
    });
    onSuccess(res.data.values[0][0]);
  } catch(error) {
    onErr(error);
  }
};

module.exports.addSheet = function(onErr, onSuccess) {
  const request = {
    spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: currentMonth,
            }
          }
        }
      ]
    }
  };
  sheets.spreadsheets.batchUpdate(request, (err) => {
    if (err) {
      onErr(err);
      return;
    }

    fulfillSheet(currentMonth, onErr, onSuccess);
  });
};

module.exports.addSavings = async function(data, onErr, onSuccess) {
  if (!data || !data.length) return;
  try {
    const result = await sheets.spreadsheets.values.update(
      {
        spreadsheetId,
        range: `${currentMonth}!F2:F2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data
        }
      }
    );
    onSuccess(result);
  } catch (error) {
    onErr(error);
  }
}
