const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');

const { categories, months } = require('./constants');
const { addExpense, addIncome, getBalance } = require('./sheets');

dotenv.config();

const incomeList = [];
const expenseList = [];
let currentOperation;

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

function handleError(err) {
  console.error(err);
}

bot.onText(/\/start/, (msg) => {
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({
      keyboard: [['Добавить доход'], ['Добавить расход'], ['Остаток']]
    })
  };

  bot.sendMessage(msg.chat.id, 'Что нужно сделать?', opts);
});

bot.onText(/Добавить доход/, (msg) => {
  currentOperation = 'income';
  bot.sendMessage(
    msg.chat.id,
    'Укажи доход в формате Месяц-Сумма-Категория-Комментарий. Пример - Февраль-2000-Постоянный-ЗП'
  );
});

bot.onText(/Добавить расход/, (msg) => {
  currentOperation = 'expense';

  bot.sendMessage(
    msg.chat.id,
    `Укажи расход в формате Дата-Сумма-Категория-Комментарий. Пример - 01.01.1970-1000-Продукты-Пятерочка
    Доступные категории - ${categories.join(', ')}
    `
  );
});

bot.onText(/(.+)-(.+)-(.+)-(.+)/, (msg, match) => {
  const operation = [];
  let operationName = '';
  msg.text.split('-').forEach((item) => operation.push(item));
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Добавить еще',
            callback_data: 'Add'
          }
        ]
      ]
    }
  };
  const handleSuccess = () => {
    bot.sendMessage(msg.chat.id, `${operationName} добавлен`, opts);
  };
  if (currentOperation === 'income') {
    if (!months.includes(match[1])) {
      bot.sendMessage(
        msg.chat.id,
        'Введи правильное название месяца в формате Январь'
      );
      return;
    }
    incomeList.push(operation);
    operationName = 'Доход';
    addIncome([operation], handleError, handleSuccess);
  }
  if (currentOperation === 'expense') {
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

bot.on('callback_query', (cbQuery) => {
  const action = cbQuery.data;
  const msg = cbQuery.message;

  if (action === 'Add') {
    const addMsg =
      currentOperation === 'income' ? 'Добавить доход' : 'Добавить расход';
    bot.sendMessage(msg.chat.id, addMsg);
  }
});
