// 콘텐츠 데이터 — qr.mumenglishkids.co.kr 앱 구성 기준
'use strict';

const CONTENT_BASE = 'https://qr.mumenglishkids.co.kr';
const VOL_COUNT = 12;

const CATEGORIES = {
  story:     { label: 'Story Song',            cls: 'c-story' },
  audio:     { label: 'Audio',                 cls: 'c-audio' },
  animation: { label: 'Animation',             cls: 'c-anim' },
  chant:     { label: 'Story Chant',           cls: 'c-chant' },
  theme:     { label: 'Theme Song',            cls: 'c-theme' },
  drama:     { label: 'Drama',                 cls: 'c-drama' },
  telling:   { label: 'Storytelling',          cls: 'c-telling' },
  speaking:  { label: 'Speaking Song',         cls: 'c-speaking' },
  dance:     { label: 'Story Song Dance ver.', cls: 'c-dance' },
  alphabet:  { label: 'Alphabet Song',         cls: 'c-alphabet' },
  all:       { label: 'ALL',                   cls: 'c-all' },
};

const THEME_SONGS = [
  'LOVE SONG', 'WEATHER SONG', 'THANK YOU SONG', 'HOW ARE YOU SONG',
  'POTTY TIME SONG', 'SAFETY SONG', 'DANCE SONG', 'FEELINGS SONG',
  'SORRY SONG', 'GOODBYE SONG', 'BIRTHDAY SONG', 'GOOD NIGHT SONG',
];

// 나이별: 사용 가능한 카테고리(메뉴 순서), Vol 제목(story 기준), 카테고리별 제목 예외
const AGES = {
  4: {
    cats: ['story', 'audio', 'animation', 'chant'],
    titles: [
      'Good Morning! Sorry! Thank You!', 'Wake Up, Flower', 'Animal Families Full of Love',
      'Where Are My Babies', 'One Summer Day', 'Hunting for My Shape',
      'What’s on Your Mind, Kitty', 'What Are You Doing', 'I Don’t Like My Nose!',
      'What Is This', 'A Wonderful Day', 'What Do You Like',
    ],
    overrides: {
      animation: [
        'Jake in the Kindergarten', 'Wake Up, Flower', 'Families Full of Love',
        'Where Are My Babies', 'One Summer Day', 'Hunting for My Shape',
        'What’s on Your Mind, Kitty', 'Whose Shadow Is This', 'I Don’t Like My Nose!',
        'What Is This', 'A Wonderful Day', 'What Do You Like',
      ],
    },
  },
  5: {
    cats: ['story', 'audio', 'animation', 'theme', 'drama', 'telling', 'speaking', 'dance', 'alphabet', 'all'],
    titles: [
      'What’s Wrong with This Picture?', 'My Feelings', 'We Have Cool Parts',
      'My Morning Trip', 'What Shall We Do', 'Let’s Go to Ping’s',
      'Dragon’s Amazing Pizza', 'Let’s Play Hide-and-Seek!', 'I Love Colors',
      'What Shape Is This', 'Mr. Mouse’s General Store', 'What Do You Say',
    ],
    overrides: {
      theme: THEME_SONGS,
      alphabet: [
        'Alphabet Song A&B', 'Alphabet Song C&D', 'Alphabet Song E&F', 'Alphabet Song G&H',
        'Alphabet Song I&J', 'Alphabet Song K&L', 'Alphabet Song M&N', 'Alphabet Song O&P',
        'Alphabet Song Q&R', 'Alphabet Song S&T', 'Alphabet Song U&V&W', 'Alphabet Song X&Y&Z',
      ],
    },
  },
  6: {
    cats: ['story', 'audio', 'animation', 'theme', 'drama', 'telling', 'speaking', 'dance', 'all'],
    titles: [
      'What Are You Doing?', 'Can You Feel It', 'Who Are You',
      'This Is My House', 'Yummy Yummy', 'Sea Creatures Having Fun',
      'Monster Boo', 'Making a Magic Potion', 'What’s That Sound',
      'The Sounds of the Seasons', 'Mio’s Day', 'We Are Awesome!',
    ],
    overrides: { theme: THEME_SONGS },
  },
  7: {
    cats: ['story', 'audio', 'animation', 'theme', 'drama', 'telling', 'speaking', 'dance', 'all'],
    titles: [
      'It’s Chloe Time', 'The Weather Book', 'My Family',
      'What Do You Do', 'I Love You As Much As', 'No! No! No!',
      'What Does It Mean', 'I Love My Bear', 'My New Feelings',
      'All Kinds of Music', 'It’s Dangerous!', 'I Am the BEST!',
    ],
    overrides: { theme: THEME_SONGS },
  },
};

const DEFAULT_STATE = { age: 7, cat: 'story', vol: 1, width: 100 };
