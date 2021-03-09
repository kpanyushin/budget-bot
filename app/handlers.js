const dotenv = require('dotenv');

const { bot } = require('../index');
const { months, categories, addIncomeMsg, addExpenseMsg, defaultKeyboard } = require('./constants');
const {
  createNewToken,
  addExpense,
  addSavings,
  getBalance,
  authorize,
  addIncome,
  addSheet,
} = require('./sheets');
const { remind } = require('./reminder');

dotenv.config();

const incomeList = [];
const expenseList = [];
/**
 * @type {'income'|'expense'}
 */
let currentOperation;

function handleError(err) {
  console.error(err);
}

bot.onText(/\/start/, (msg) => {
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({ keyboard: defaultKeyboard })
  };

  bot.sendMessage(msg.chat.id, 'Что нужно сделать?', opts);
});

bot.onText(/Токен - (.+)/, (_, match) => {
  createNewToken(match[1]);
});

bot.onText(/Добавить доход/, (msg) => {
  currentOperation = 'income';
  bot.sendMessage(msg.chat.id, addIncomeMsg);
});

bot.onText(/Добавить расход/, (msg) => {
  currentOperation = 'expense';

  bot.sendMessage(msg.chat.id, addExpenseMsg);
});

bot.onText(/(.+)-(.+)-(.+)/, (msg) => {
  const operation = [];
  let operationName = '';
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Добавить еще',
            callback_data: currentOperation,
          }
        ]
      ]
    }
  };
  const handleSuccess = () => {
    bot.sendMessage(msg.chat.id, `${operationName} добавлен`, opts);
  };
  if (currentOperation === 'income') {
    operation.push(months[new Date().getMonth()]);
    msg.text.split('-').forEach((item) => {
      operation.push(item);
    });
    incomeList.push(operation);
    operationName = 'Доход';
    addIncome([operation], handleError, handleSuccess);
  }
  if (currentOperation === 'expense') {
    operation.push(new Date().toLocaleDateString());
    msg.text.split('-').forEach((item, index) => {
      if (index === 1) {
        operation.push(categories[item]);
      } else {
        operation.push(item);
      }
    });
    expenseList.push(operation);
    operationName = 'Расход';
    addExpense([operation], handleError, handleSuccess);
  }
});

bot.onText(/Остаток/, (msg) => {
  const handleSuccess = (res) => {
    bot.sendMessage(msg.chat.id, `На траты осталось ${res} крон`);
  };
  getBalance(handleError, handleSuccess);
});

bot.onText(/Добавить новый лист/, (msg) => {
  const handleSuccess = () => {
    bot.sendMessage(msg.chat.id, 'Новый лист добавлен');
  };
  addSheet(handleError, handleSuccess);
});

bot.onText(/Отложить/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Укажи сумму, которую нужно отложить');
});

bot.onText(/\/save (.+)/, (msg, match) => {
  const saveAmount = match[1];
  const handleSuccess = () => {
    bot.sendMessage(msg.chat.id, `Отложено ${saveAmount} крон`);
  };
  addSavings([[saveAmount]], handleError, handleSuccess);
});

bot.on('message', (msg) => {
  authorize(msg);
  remind(msg);
});

bot.on('callback_query', (cbQuery) => {
  const action = cbQuery.data;
  const msg = cbQuery.message;

  if (action === 'income') {
    bot.sendMessage(msg.chat.id, addIncomeMsg);
  }

  if (action === 'expense') {
    bot.sendMessage(msg.chat.id, addExpenseMsg);
  }
});
