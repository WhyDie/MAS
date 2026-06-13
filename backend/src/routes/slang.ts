import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import * as crypto from 'crypto';

const router = Router();

const ensureTable = async () => {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS "slang_dictionary" (
      "id" varchar PRIMARY KEY,
      "term" varchar NOT NULL,
      "description" text NOT NULL,
      "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});

  try {
    const countRes = await AppDataSource.query('SELECT COUNT(*) as cnt FROM "slang_dictionary"');
    if (countRes[0] && parseInt(countRes[0].cnt) === 0) {
      const SLANG_TERMS = [
        { term: 'ВОП', desc: 'Взводний опорний пункт. Місце, де розташовується і веде оборону взвод.' },
        { term: 'РОП', desc: 'Ротний опорний пункт. Більша за ВОП позиція для оборони роти.' },
        { term: 'СП / КСП', desc: 'Спостережний пункт / Командно-спостережний пункт.' },
        { term: 'БР (Берешка)', desc: 'Бойове розпорядження. Офіційний письмовий наказ на виконання завдання.' },
        { term: 'ПВД', desc: 'Пункт постійної дислокації (або ТПД - тимчасової). База підрозділу.' },
        { term: 'Евак', desc: 'Медична евакуація (MEDEVAC). Транспорт, який вивозить поранених з поля бою.' },
        { term: 'Дашка', desc: 'ДШК (Станковий крупнокаліберний кулемет Дегтярьова-Шпагіна 12.7 мм).' },
        { term: 'Покемон', desc: 'ПКМ (Кулемет Калашникова Модернізований 7.62 мм).' },
        { term: 'Тепляк', desc: 'Тепловізор. Прилад для виявлення цілей за тепловим випромінюванням.' },
        { term: 'Нічник', desc: 'Прилад нічного бачення (ПНБ).' },
        { term: 'Мавік', desc: 'Квадрокоптер DJI Mavic. Найпоширеніший дрон для розвідки та скидів.' },
        { term: 'Корч', desc: 'Автомобіль (зазвичай старий позашляховик), який використовується на фронті.' },
        { term: 'Нуль', desc: 'Передова лінія фронту, лінія безпосереднього зіткнення з ворогом.' },
        { term: 'Піксель', desc: 'Офіційна камуфляжна форма ЗСУ (патерн ММ-14).' },
        { term: 'Мультикам', desc: 'Популярний комерційний камуфляж (багатоколірний паттерн).' },
        { term: 'БК', desc: 'Боєкомплект. Запас патронів, гранат та снарядів.' },
        { term: 'Пліткарка', desc: 'Рація (найчастіше Motorola).' },
        { term: 'Нора', desc: 'Бліндаж, укриття під землею.' },
        { term: 'Пташка', desc: 'БПЛА або розвідувальний дрон.' },
        { term: '200-й (Двісті)', desc: 'Загиблий військовослужбовець (Вантаж 200).' },
        { term: '300-й (Триста)', desc: 'Поранений військовослужбовець (Вантаж 300). Потребує евакуації.' },
        { term: '400-й', desc: 'Контужений (або, в деяких підрозділах, полонений).' },
        { term: 'Орк / Підор', desc: 'Ворожий військовослужбовець збройних сил рф.' },
        { term: 'Приліт', desc: 'Падіння і розрив ворожого снаряду, ракети чи міни поруч.' },
        { term: 'Вихід', desc: 'Постріл нашої артилерії. Звук, після якого чекають розриву по ворогу.' },
        { term: 'Кабан / Свиня', desc: 'Важкий артилерійський або мінометний снаряд (120мм і більше).' },
        { term: 'Морковка', desc: 'Снаряд (постріл) до протитанкового гранатомета РПГ-7.' },
        { term: 'Олівець', desc: 'Осколковий постріл (ВОГ-25) до підствольного гранатомета або РПГ.' },
        { term: 'Слони', desc: 'Новобранці, молоді недосвідчені бійці під час навчання або одразу по прибуттю.' },
        { term: 'Зеленка', desc: 'Лісосмуга, ліс, хащі — місця з густою рослинністю для маскування.' },
        { term: 'Молоко', desc: 'Промах. Стрільба "в молоко" — кудись повз ціль.' },
        { term: 'Бехи', desc: 'БМП (Бойова машина піхоти).' },
        { term: 'Міцик / Елька', desc: 'Автомобіль Mitsubishi L200 (дуже популярний пікап на фронті).' },
        { term: 'Шишига', desc: 'Вантажівка ГАЗ-66.' },
        { term: 'Муха', desc: 'РПГ-18 (одноразовий ручний протитанковий гранатомет).' },
        { term: 'Метр / Перший', desc: 'Командир або старший за званням у групі.' },
        { term: 'Банка', desc: 'Глушник (саундмодератор) на стрілецьку зброю.' },
        { term: 'Плитоноска', desc: 'Чохол для бронеплит (Plate Carrier), різновид easyго бронежилета.' },
        { term: 'СЗЧ', desc: 'Самовільне залишення частини (кримінальний злочин).' },
        { term: 'ВЛК', desc: 'Військово-лікарська комісія. Оцінює придатність бійця до служби.' },
        { term: 'МСЕК', desc: 'Медико-соціальна експертна комісія. Призначає групу інвалідності після поранення.' },
        { term: 'УБД', desc: 'Учасник бойових дій (статус та посвідчення).' },
        { term: 'Світлячок', desc: 'Боєць, який демаскує позицію світлом ліхтарика або сигаретою вночі.' },
        { term: 'ФПВ (FPV)', desc: 'Дрон First Person View (вид від першої особи). Найчастіше — дрон-камікадзе.' },
        { term: 'Скид', desc: 'Процес скидання гранати чи іншого боєприпасу з дрона (Мавіка) на ворога.' }
      ];
      for (const t of SLANG_TERMS) {
        await AppDataSource.query(
          'INSERT INTO "slang_dictionary" ("id", "term", "description") VALUES (?, ?, ?)',
          [crypto.randomUUID(), t.term, t.desc]
        );
      }
      console.log('✅ Військовий словник успішно заповнено (50+ термінів)!');
    }
  } catch (e) { console.error('Slang seed error:', e); }
};

router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const terms = await AppDataSource.query('SELECT * FROM "slang_dictionary" ORDER BY "term" ASC');
    sendSuccess(res, terms);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const { term, description } = req.body;
    const id = crypto.randomUUID();
    await AppDataSource.query('INSERT INTO "slang_dictionary" ("id", "term", "description") VALUES (?, ?, ?)', [id, term, description]);
    sendSuccess(res, { id, term, description });
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.put('/:id', async (req, res) => {
  try {
    const { term, description } = req.body;
    await AppDataSource.query('UPDATE "slang_dictionary" SET "term" = ?, "description" = ? WHERE id = ?', [term, description, req.params.id]);
    sendSuccess(res, null);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    await AppDataSource.query('DELETE FROM "slang_dictionary" WHERE id = ?', [req.params.id]);
    sendSuccess(res, null);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

export default router;