/*
 * Все товары магазина. Каталог (catalog.html) показывает их в порядке этого списка,
 * карусель «Popular collections» на главной — только те, у кого есть popular.
 * Чтобы добавить товар — скопируйте объект и поменяйте поля.
 *
 *  id       — уникальный ключ (латиница)
 *  title    — название (как на карточке)
 *  edition  — вторая строка названия, например «DVD с концертом» (необязательно)
 *  artist   — исполнитель; "\n" переносит строку на карточке карусели
 *  price    — цена в рублях; 0 = FREE!
 *  format   — vinyl | cd | dvd — в каком разделе каталога лежит товар
 *  genres   — rock | pop | metal | hip-hop | electronic | rap | jazz
 *  img      — картинка обложки (assets/img/...)
 *  gift     — true: большая карточка «Подарок специально от магазина!» в разделе винила
 *  popular  — место в карусели на главной (1, 2, 3...); нет поля — товара в карусели нет
 *  pos      — положение картинки в карточке карусели 630×885 (в пикселях макета);
 *             без pos картинка просто вписывается в карточку
 */
window.PRODUCTS = [
  /* ---------- винил ---------- */
  {
    id: 'neon-amnesia',
    title: 'Neon Amnesia',
    artist: 'The Last Disk',
    price: 0,
    format: 'vinyl',
    genres: ['rock'],
    img: 'assets/img/album-neon-amnesia.png',
    gift: true,
    popular: 1,
    pos: { x: 23, y: 45, w: 581 }
  },
  {
    id: 'the-sickness',
    title: 'The Sickness',
    artist: 'DISTURBED',
    price: 4300,
    format: 'vinyl',
    genres: ['metal'],
    img: 'assets/img/album-the-sickness.png',
    popular: 7,
    pos: { x: 32, y: 51, w: 575 }
  },
  {
    id: 'dont-smile-at-me',
    title: 'Don’t Smile at Me (Red)',
    artist: 'BILLIE EILISH',
    price: 6000,
    format: 'vinyl',
    genres: ['pop'],
    img: 'assets/img/album-dont-smile-at-me.png',
    popular: 6,
    pos: { x: 50, y: 61, w: 552 }
  },
  {
    id: 'thriller',
    title: 'Thriller',
    artist: 'Michael Jackson',
    price: 4000,
    format: 'vinyl',
    genres: ['pop'],
    img: 'assets/img/album-thriller.png',
    popular: 2,
    pos: { x: 34, y: 56, w: 566 }
  },
  {
    id: 'ride-the-lightning',
    title: 'Ride the Lightning',
    artist: 'METALLICA',
    price: 6000,
    format: 'vinyl',
    genres: ['metal'],
    img: 'assets/img/album-ride-the-lightning.png',
    popular: 3,
    pos: { x: 42, y: 50, w: 578 }
  },
  {
    id: 'the-way-of-the-fist',
    title: 'The Way of the Fist',
    artist: 'FIVE FINGER\nDEATH PUNCH',
    price: 3200,
    format: 'vinyl',
    genres: ['metal'],
    img: 'assets/img/album-way-of-the-fist.png',
    popular: 4,
    pos: { x: 39, y: 52, w: 575 }
  },
  {
    id: 'cracker-island',
    title: 'Cracker Island',
    artist: 'GORILLAZ',
    price: 4400,
    format: 'vinyl',
    genres: ['electronic', 'pop'],
    img: 'assets/img/album-cracker-island.png'
  },
  {
    id: 'razorblade-romance',
    title: 'Razorblade Romance',
    artist: 'HIM',
    price: 3600,
    format: 'vinyl',
    genres: ['rock'],
    img: 'assets/img/album-razorblade-romance.png',
    popular: 5,
    pos: { x: 32, y: 53, w: 569 }
  },
  {
    id: 'curtain-call',
    title: 'Curtain Call: The Hits',
    artist: 'EMINEM',
    price: 8600,
    format: 'vinyl',
    genres: ['rap', 'hip-hop'],
    img: 'assets/img/album-curtain-call.png'
  },

  /* ---------- CD ---------- */
  {
    id: 'one-assassination-under-god',
    title: 'One Assassination Under God — Chapter 1 CD',
    artist: 'Marilyn Manson',
    price: 1600,
    format: 'cd',
    genres: ['rock', 'metal'],
    img: 'assets/img/cd-one-assassination.png'
  },
  {
    id: 'dirt',
    title: 'Dirt CD',
    artist: 'Alice In Chains',
    price: 1000,
    format: 'cd',
    genres: ['rock', 'metal'],
    img: 'assets/img/cd-dirt.png'
  },
  {
    id: 'liminal-animals',
    title: 'Liminal Animals CD',
    artist: 'Ulver',
    price: 800,
    format: 'cd',
    genres: ['electronic'],
    img: 'assets/img/cd-liminal-animals.png'
  },
  {
    id: 'vol-3',
    title: 'Vol. 3 CD',
    artist: 'Slipknot',
    price: 2600,
    format: 'cd',
    genres: ['metal'],
    img: 'assets/img/cd-vol-3.png'
  },
  {
    id: 'korol-i-shut-acoustic',
    title: 'Акустический альбом CD',
    artist: 'Король и Шут',
    price: 1200,
    format: 'cd',
    genres: ['rock'],
    img: 'assets/img/cd-korol-i-shut-acoustic.png'
  },
  {
    id: 'the-downward-spiral',
    title: 'The Downward Spiral CD',
    artist: 'NINE INCH NAILS',
    price: 1050,
    format: 'cd',
    genres: ['rock', 'electronic'],
    img: 'assets/img/cd-downward-spiral.png'
  },
  {
    id: 'songs-from-the-big-chair',
    title: 'Songs from the Big Chair CD',
    artist: 'TEARS FOR FEARS',
    price: 1600,
    format: 'cd',
    genres: ['pop', 'rock'],
    img: 'assets/img/cd-songs-from-the-big-chair.png'
  },
  {
    id: 'chocolate-starfish',
    title: 'Chocolate Starfish and the Hot Dog Flavored Water',
    artist: 'LIMP BIZKIT',
    price: 1330,
    format: 'cd',
    genres: ['rock', 'rap', 'metal'],
    img: 'assets/img/cd-chocolate-starfish.png'
  },

  /* ---------- DVD ---------- */
  {
    id: 'korn-1994',
    title: 'Korn (1994)',
    edition: 'DVD с концертом',
    artist: 'Korn',
    price: 1000,
    format: 'dvd',
    genres: ['metal'],
    img: 'assets/img/dvd-korn-1994.png'
  },
  {
    id: 'past-present-future',
    title: 'Past, Present & Future',
    edition: 'DVD с концертом',
    artist: 'Rob Zombie',
    price: 1900,
    format: 'dvd',
    genres: ['metal'],
    img: 'assets/img/dvd-past-present-future.png'
  },
  {
    id: 'live-at-montreux-2011',
    title: 'Live at Montreux (2011)',
    edition: 'DVD с концертом',
    artist: 'Deep Purple & Orchestra',
    price: 1200,
    format: 'dvd',
    genres: ['rock'],
    img: 'assets/img/dvd-live-at-montreux.png'
  },
  {
    id: 'i-will-always-love-you',
    title: 'I Will Always Love You',
    edition: 'DVD с концертом',
    artist: 'Whitney Houston',
    price: 1900,
    format: 'dvd',
    genres: ['pop'],
    img: 'assets/img/dvd-i-will-always-love-you.png'
  }
];
