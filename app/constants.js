export const categories = [
  'Продукты',
  'Пиво',
  'Вино',
  'Другой алкоголь',
  'Доставка еды',
  'Развлечения',
  'Квартира',
  'Техника',
  'Крупные покупки',
  'Транспорт',
  'Медицина',
  'Красота',
  'Одежда',
  'Спорт',
  'Рестораны',
  'Такси',
  'Другое'
];

// module.exports.categories = {
//   '1': 'Продукты',
//   '2': 'Пиво',
//   '3': 'Вино',
//   '4': 'Другой алкоголь',
//   '5': 'Доставка еды',
//   '6': 'Развлечения',
//   '7': 'Квартира',
//   '8': 'Техника',
//   '9': 'Крупные покупки',
//   '10': 'Транспорт',
//   '11': 'Медицина',
//   '12': 'Красота',
//   '13': 'Одежда',
//   '14': 'Спорт',
//   '15': 'Рестораны',
//   '16': 'Такси',
//   '17': 'Другое'
// };

export const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

export const defaultKeyboard = [
  ['Добавить доход'],
  ['Добавить расход'],
  ['Остаток'],
  ['Отложить'],
  ['Добавить новый месяц'],
];

export const addIncomeMsg = 
`
Укажи доход в формате Месяц-Сумма-Категория-Комментарий.

Пример - Февраль-2000-Постоянный-ЗП
`;

export const addExpenseMsg = 
`Укажи расход в формате Дата-Сумма-Категория-Комментарий.

Пример - 01.01.1970-1000-Продукты-Пятерочка

Доступные категории:

${categories.join(', \n')}
`;

export const incomeSheetName = 'Доход';
