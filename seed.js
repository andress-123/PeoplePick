// seed.js — ejecutar UNA SOLA VEZ para poblar Firestore
// Uso: node seed.js
//
// Requiere: npm install firebase-admin
// Descarga tu serviceAccountKey.json desde Firebase Console →
// Project Settings → Service Accounts → Generate new private key

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const PEOPLE = [
  { name: "Lionel Messi",           category: "Sports",     votes: 45231 },
  { name: "Cristiano Ronaldo",      category: "Sports",     votes: 44892 },
  { name: "Michael Jackson",        category: "Music",      votes: 42105 },
  { name: "Albert Einstein",        category: "Science",    votes: 40567 },
  { name: "Nelson Mandela",         category: "Politics",   votes: 39812 },
  { name: "Taylor Swift",           category: "Music",      votes: 38921 },
  { name: "Elon Musk",              category: "Technology", votes: 37456 },
  { name: "Barack Obama",           category: "Politics",   votes: 33245 },
  { name: "Michael Jordan",         category: "Sports",     votes: 32678 },
  { name: "Muhammad Ali",           category: "Sports",     votes: 31554 },
  { name: "Martin Luther King Jr.", category: "Activism",   votes: 27800 },
  { name: "Mahatma Gandhi",         category: "Activism",   votes: 27200 },
  { name: "Marie Curie",            category: "Science",    votes: 26500 },
  { name: "Isaac Newton",           category: "Science",    votes: 25900 },
  { name: "Nikola Tesla",           category: "Science",    votes: 25100 },
  { name: "Leonardo da Vinci",      category: "Art",        votes: 24400 },
  { name: "Steve Jobs",             category: "Technology", votes: 23800 },
  { name: "Bill Gates",             category: "Technology", votes: 22600 },
  { name: "The Beatles",            category: "Music",      votes: 21900 },
  { name: "Beyoncé",                category: "Music",      votes: 21200 },
  { name: "William Shakespeare",    category: "Literature", votes: 20500 },
  { name: "Vincent van Gogh",       category: "Art",        votes: 19800 },
  { name: "Pablo Picasso",          category: "Art",        votes: 19100 },
  { name: "Marilyn Monroe",         category: "Cinema",     votes: 18400 },
  { name: "Charlie Chaplin",        category: "Cinema",     votes: 17700 },
  { name: "Winston Churchill",      category: "Politics",   votes: 17000 },
  { name: "Napoleon Bonaparte",     category: "Politics",   votes: 15700 },
  { name: "Abraham Lincoln",        category: "Politics",   votes: 13900 },
  { name: "Karl Marx",              category: "Philosophy", votes: 12700 },
  { name: "Sigmund Freud",          category: "Science",    votes: 12100 },
  { name: "Friedrich Nietzsche",    category: "Philosophy", votes: 11500 },
  { name: "Socrates",               category: "Philosophy", votes: 10900 },
  { name: "Aristotle",              category: "Philosophy", votes: 10300 },
  { name: "Charles Darwin",         category: "Science",    votes:  9200 },
  { name: "Stephen Hawking",        category: "Science",    votes:  8700 },
  { name: "Rosa Parks",             category: "Activism",   votes:  7800 },
  { name: "Frida Kahlo",            category: "Art",        votes:  7000 },
  { name: "Oscar Wilde",            category: "Literature", votes:  6600 },
  { name: "George Orwell",          category: "Literature", votes:  6200 },
  { name: "Leo Tolstoy",            category: "Literature", votes:  5800 },
  { name: "Mark Twain",             category: "Literature", votes:  5000 },
  { name: "Ernest Hemingway",       category: "Literature", votes:  4700 },
  { name: "Virginia Woolf",         category: "Literature", votes:  4100 },
  { name: "Marilyn Monroe",         category: "Cinema",     votes:  3500 },
  { name: "Bruce Lee",              category: "Sports",     votes:  2300 },
  { name: "Serena Williams",        category: "Sports",     votes:  2100 },
  { name: "Alan Turing",            category: "Technology", votes:   800 },
  { name: "Ada Lovelace",           category: "Technology", votes:   700 },
  { name: "Voltaire",               category: "Philosophy", votes:   310 },
  { name: "Dante Alighieri",        category: "Literature", votes:   260 },
];

async function seed() {
  console.log(`Seeding ${PEOPLE.length} people...`);
  const batch = db.batch();
  const col = db.collection('people');
  PEOPLE.forEach(p => {
    const ref = col.doc();
    batch.set(ref, { ...p, createdAt: Timestamp.now() });
  });
  await batch.commit();
  console.log('✅ Done!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
