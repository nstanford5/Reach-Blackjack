import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs'; // import backend
const stdlib = loadStdlib();

function sleep(milliseconds){
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}


console.log(`Welcome to BlackJack`);
sleep(2000);
console.log(`Have a seat card Shark`);
sleep(2000);
console.log(`This is a heads up game, Shark vs Dealer`);
sleep(2000);
console.log(`Both start with 1000 balance`);
sleep(2000);

const startingBalance = stdlib.parseCurrency(1000);
const accShark = await stdlib.newTestAccount(startingBalance);
const accDealer = await stdlib.newTestAccount(startingBalance);

const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
const beforeShark = await getBalance(accShark);
const beforeDealer = await getBalance(accDealer);

const ctcShark = accShark.contract(backend);
const ctcDealer = accDealer.contract(backend, ctcShark.getInfo());

const CARD = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const OUTCOME = ['Card Shark wins!', 'Dealer wins!', 'Draw'];

const Player = (Who) => ({
  ...stdlib.hasRandom,
  getCard: async () => {
    const card = Math.floor(Math.random() * 13);
    console.log(`${Who} drew a ${CARD[card]}`)
    return card;
  },
  seeOutcome: (outcome) => {
    console.log(`${Who} saw outcome ${OUTCOME[outcome]}`);
  },
  informTimeout: () => {
    console.log(`${Who} observed a timeout`);
  },
});

await Promise.all([
  ctcShark.p.Shark({
    ...Player('Shark'),
    wager: stdlib.parseCurrency(5),
    deadline: 10,
  }),
  ctcDealer.p.Dealer({
    ...Player('Dealer'),
    acceptWager: async (amount) => {
      console.log(`Dealer accepts the wager of ${fmt(amount)}`);
    },
  }),
]);

const afterShark = await getBalance(accShark);
const afterDealer = await getBalance(accDealer);

console.log(`Card Shark went from ${beforeShark} to ${afterShark}.`);
console.log(`Dealer went from ${beforeDealer} to ${afterDealer}.`);
