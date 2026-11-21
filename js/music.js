/* =====================================================================
   THE LAST DISK — музыка на главной
   Наводишь мышку на диск ROCK / POP / METALL — играет случайная песня
   этого жанра с указанной секунды; убираешь мышку — музыка затихает.

   Файлы песен (mp3) кладутся в assets/audio/<жанр>/ с именами из списка
   ниже. Песни, файла которых нет, просто пропускаются.

   Браузеры не дают сайту включать звук, пока человек ни разу не нажал
   на странице (клик, касание, клавиша). Поэтому до первого клика
   наведение молчит, а сайт один раз подсказывает об этом.
   На телефонах наведения нет — там музыка не играет.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Плейлисты. start — с какой секунды играть ('0:55' или '0').
     ------------------------------------------------------------------ */
  var TRACKS = {
    rock: [
      { file: 'sleeping-powder.mp3',      title: 'Sleeping Powder',      artist: 'Gorillaz',          start: '0:55' },
      { file: 'rape-me.mp3',              title: 'Rape Me',              artist: 'Nirvana',           start: '0:25' },
      { file: 'this-is-the-new-shit.mp3', title: 'This Is The New Shit', artist: 'Marilyn Manson',    start: '0:25' },
      { file: 'in-the-end.mp3',           title: 'In the End',           artist: 'Linkin Park',       start: '0:18' },
      { file: 'living-dead-girl.mp3',     title: 'Living Dead Girl',     artist: 'Rob Zombie',        start: '0:58' },
      { file: 'not-me.mp3',               title: 'Not Me',               artist: 'Lo-Pro',            start: '0:28' },
      { file: 'bloodline.mp3',            title: 'Bloodline',            artist: 'Slayer',            start: '0:43' },
      { file: 'centuries.mp3',            title: 'Centuries',            artist: 'Fall Out Boy',      start: '0:50' },
      { file: 'i-stand-alone.mp3',        title: 'I Stand Alone',        artist: 'Godsmack',          start: '0:20' },
      { file: 'diamond-eyes.mp3',         title: 'Diamond Eyes',         artist: 'Deftones',          start: '0:23' },
      { file: 'you-must-burn.mp3',        title: 'You Must Burn',        artist: 'Metallica',         start: '1:50' },
      { file: 'the-memory-remains.mp3',   title: 'The Memory Remains',   artist: 'Metallica feat. Marianne Faithfull', start: '0:00' },
      { file: 'devils-dance.mp3',         title: 'Devil’s Dance',        artist: 'Metallica',         start: '2:14' },
      { file: 'enter-sandman.mp3',        title: 'Enter Sandman',        artist: 'Metallica',         start: '1:20' }
    ],
    pop: [
      { file: 'donatella.mp3',            title: 'Donatella',            artist: 'Lady Gaga',         start: '1:05' },
      { file: 'new-thang.mp3',            title: 'New Thang',            artist: 'Redfoo',            start: '0:25' },
      { file: 'party-rock-anthem.mp3',    title: 'Party Rock Anthem',    artist: 'LMFAO',             start: '0:50' },
      { file: 'call-me-maybe.mp3',        title: 'Call Me Maybe',        artist: 'Carly Rae Jepsen',  start: '0:32' },
      { file: 'rockabye.mp3',             title: 'Rockabye',             artist: 'Clean Bandit',      start: '0:55' },
      { file: 'girl-like-me.mp3',         title: 'Girl Like Me',         artist: 'Black Eyed Peas, Shakira', start: '2:45' },
      { file: 'le-freak.mp3',             title: 'Le Freak',             artist: 'Chic',              start: '0:00' },
      { file: 'cry-for-me.mp3',           title: 'Cry for Me',           artist: 'Camila Cabello',    start: '0:36' },
      { file: 'royal-pain.mp3',           title: 'Royal Pain',           artist: 'Eels',              start: '0:07' },
      { file: 'please-me.mp3',            title: 'Please Me',            artist: 'Cardi B, Bruno Mars', start: '0:18' },
      { file: 'bad-guy.mp3',              title: 'bad guy',              artist: 'Billie Eilish',     start: '0:58' },
      { file: 'dynamite.mp3',             title: 'Dynamite',             artist: 'Taio Cruz',         start: '0:29' },
      { file: 's-and-m.mp3',              title: 'S&M',                  artist: 'Rihanna',           start: '0:59' }
    ],
    metal: [
      { file: 'duality.mp3',              title: 'Duality',              artist: 'Slipknot',          start: '0:00' },
      { file: 'mouth-for-war.mp3',        title: 'Mouth for War',        artist: 'Pantera',           start: '0:26' },
      { file: 'my-own-summer.mp3',        title: 'My Own Summer (Shove It)', artist: 'Deftones',      start: '0:19' },
      { file: 'youll-never-find-me.mp3',  title: 'You’ll Never Find Me', artist: 'Korn',              start: '2:24' },
      { file: 'rope.mp3',                 title: 'Rope',                 artist: '40 Below Summer',   start: '3:08' },
      { file: 'ill-cast-a-shadow.mp3',    title: 'I’ll Cast a Shadow',   artist: 'Pantera',           start: '0:22' },
      { file: 'mine-end-this-way.mp3',    title: 'M.I.N.E (End This Way)', artist: 'Five Finger Death Punch', start: '0:53' },
      { file: 'devil-came-with-a-smile.mp3', title: 'Devil Came with a Smile', artist: 'A Pale Horse Named Death', start: '1:30' },
      { file: 'red-water.mp3',            title: 'Red Water (Christmas Mourning)', artist: 'Type O Negative', start: '2:16' },
      { file: 'links-2-3-4.mp3',          title: 'Links 2 3 4',          artist: 'Rammstein',         start: '1:35' },
      { file: 'seen-it-all.mp3',          title: 'Seen It All',          artist: 'Mushroomhead',      start: '1:10' },
      { file: 'before-i-forget.mp3',      title: 'Before I Forget',      artist: 'Slipknot',          start: '0:56' },
      { file: 'the-devil-in-i.mp3',       title: 'The Devil in I',       artist: 'Slipknot',          start: '1:45' },
      { file: 'psychosocial.mp3',         title: 'Psychosocial',         artist: 'Slipknot',          start: '1:05' },
      { file: 'too-late-frozen.mp3',      title: 'Too Late: Frozen',     artist: 'Type O Negative',   start: '3:30' },
      { file: 'nettie.mp3',               title: 'Nettie',               artist: 'Type O Negative',   start: '1:09' }
    ]
  };
  var VOLUME = 0.6;   // громкость 0…1
  var FADE_MS = 450;  // плавное появление и затухание

  var discs = Array.prototype.slice.call(document.querySelectorAll('.genre-disc[data-filter-genre]'));
  if (!discs.length || !window.Audio) return;
  if (window.matchMedia && !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  function seconds(t) {
    var p = String(t).split(':').map(Number);
    return p.length === 2 ? p[0] * 60 + p[1] : p[0] || 0;
  }
  Object.keys(TRACKS).forEach(function (genre) {
    TRACKS[genre].forEach(function (t) {
      t.src = 'assets/audio/' + genre + '/' + t.file;
      t.at = seconds(t.start);
    });
  });

  var audio = new Audio();
  audio.preload = 'none';
  var playing = null;    // { genre, track } — что играет (или грузится) сейчас
  var lastTrack = {};    // последняя песня жанра — чтобы не повторять её подряд
  var missing = {};      // файлы, которых нет на сервере
  var fadeFrame = 0;
  var hinted = false;

  function pick(genre) {
    var ok = (TRACKS[genre] || []).filter(function (t) { return !missing[t.src]; });
    var fresh = ok.filter(function (t) { return t !== lastTrack[genre]; });
    var list = fresh.length ? fresh : ok;
    return list[Math.floor(Math.random() * list.length)];
  }

  function fadeTo(target, done) {
    cancelAnimationFrame(fadeFrame);
    var from = audio.volume;
    var t0 = performance.now();
    var step = function (now) {
      var k = Math.min(1, (now - t0) / FADE_MS);
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * k)); // без выхода за 0…1 из-за округления
      if (k < 1) fadeFrame = requestAnimationFrame(step);
      else if (done) done();
    };
    fadeFrame = requestAnimationFrame(step);
  }

  function play(genre) {
    var track = pick(genre);
    if (!track) { playing = null; return; } // для жанра нет ни одного файла
    lastTrack[genre] = track;
    playing = { genre: genre, track: track };
    cancelAnimationFrame(fadeFrame);
    audio.volume = 0;
    audio.src = track.src + '#t=' + track.at; // #t= — начать с нужной секунды
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        if (playing && playing.track === track) fadeTo(VOLUME);
      }).catch(function (err) {
        if (err && err.name === 'NotAllowedError') hint();
      });
    }
  }

  function stop() {
    playing = null;
    fadeTo(0, function () { if (!playing) audio.pause(); });
  }

  // запасной вариант для браузеров, которые не понимают #t= в адресе
  audio.addEventListener('loadedmetadata', function () {
    if (playing && audio.currentTime < playing.track.at - 1) audio.currentTime = playing.track.at;
  });
  // файла нет или он битый — запоминаем и пробуем другую песню того же жанра
  audio.addEventListener('error', function () {
    if (!playing || !audio.src) return;
    missing[playing.track.src] = true;
    play(playing.genre);
  });

  function hint() {
    if (hinted) return;
    hinted = true;
    if (window.TLD && TLD.toast) TLD.toast('Кликните по странице — и диски заиграют при наведении');
  }

  discs.forEach(function (disc) {
    var genre = disc.dataset.filterGenre;
    if (!TRACKS[genre]) return;
    disc.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (!playing || playing.genre !== genre) play(genre);
    });
    disc.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (playing && playing.genre === genre) stop();
    });
  });

  // ушли на другую вкладку — тишина
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) { playing = null; audio.pause(); }
  });
})();
