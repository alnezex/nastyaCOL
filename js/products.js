/*
 * Товары для карусели «Popular collections».
 * Чтобы добавить альбом — скопируйте объект и поменяйте поля.
 *
 *  id       — уникальный ключ (латиница)
 *  title    — название (как на карточке)
 *  artist   — исполнитель; "\n" переносит строку
 *  price    — цена в рублях; 0 = FREE!
 *  genres   — rock | pop | metal | hip-hop | electronic | rap | jazz
 *  formats  — vinyl | cd | dvd | accessories
 *  img      — картинка обложки с пластинкой (assets/img/...)
 *  pos      — положение картинки внутри карточки 630×885 (в пикселях макета);
 *             если не указано, берётся стандартное { x: 34, y: 52, w: 575 }
 */
window.PRODUCTS = [
  {
    id: 'neon-amnesia',
    title: 'Neon Amnesia',
    artist: 'The Last Disk',
    price: 0,
    genres: ['rock'],
    formats: ['vinyl', 'cd'],
    img: 'assets/img/album-neon-amnesia.png',
    pos: { x: 23, y: 45, w: 581 }
  },
  {
    id: 'thriller',
    title: 'Thriller',
    artist: 'Michael Jackson',
    price: 4000,
    genres: ['pop'],
    formats: ['vinyl', 'cd'],
    img: 'assets/img/album-thriller.png',
    pos: { x: 34, y: 56, w: 566 }
  },
  {
    id: 'ride-the-lightning',
    title: 'Ride the Lightning',
    artist: 'METALLICA',
    price: 6000,
    genres: ['metal'],
    formats: ['vinyl', 'cd'],
    img: 'assets/img/album-ride-the-lightning.png',
    pos: { x: 42, y: 50, w: 578 }
  },
  {
    id: 'the-way-of-the-fist',
    title: 'The Way of the Fist',
    artist: 'FIVE FINGER\nDEATH PUNCH',
    price: 3200,
    genres: ['metal'],
    formats: ['vinyl'],
    img: 'assets/img/album-way-of-the-fist.png',
    pos: { x: 39, y: 52, w: 575 }
  },
  {
    id: 'razorblade-romance',
    title: 'Razorblade Romance',
    artist: 'HIM',
    price: 3600,
    genres: ['rock'],
    formats: ['vinyl', 'cd'],
    img: 'assets/img/album-razorblade-romance.png',
    pos: { x: 32, y: 53, w: 569 }
  },
  {
    id: 'dont-smile-at-me',
    title: 'Don’t Smile at Me (Red)',
    artist: 'BILLIE EILISH',
    price: 6000,
    genres: ['pop'],
    formats: ['vinyl'],
    img: 'assets/img/album-dont-smile-at-me.png',
    pos: { x: 50, y: 61, w: 552 }
  },
  {
    id: 'the-sickness',
    title: 'The Sickness',
    artist: 'DISTURBED',
    price: 4300,
    genres: ['metal'],
    formats: ['vinyl', 'cd'],
    img: 'assets/img/album-the-sickness.png',
    pos: { x: 32, y: 51, w: 575 }
  }
];
