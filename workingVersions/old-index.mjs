import {loadStdlib, ask} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(1000);

const [ accPlayer, accDealer ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Have a seat Player');
console.log(`I hope you left your lunch money at home..`);

const ctcDealer = accDealer.contract(backend);
const ctcPlayer = accPlayer.contract(backend, ctcDealer.getInfo());
const fmt = (x) => stdlib.formatCurrency(x, 4);
const cardDeck = { 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K' };
const intToOutcome = ['Player wins!', 'Dealer Wins!', 'Draw'];

const Shared = (Who) => ({
  startGame: async () => {
    const hands = [];
    for(let i = 0; i < 2; i++){
      const card = Math.floor(Math.random() * 12) + 1;
      hands.push(card);
    }
    console.log(`${Who} drew a ${cardDeck[hands[0]]} and ${cardDeck[hands[1]]}`);
    return [hands[0], hands[1]];
  },
  informTimeout: async () => {
    console.log(`${Who} observed a timeout.`);
    process.exit(1);
  },
  seeTotal: async (x) => {
    console.log(`The total of ${Who} cards is : ${x}`);
  },
  seeOutcome: async (x) => {
    console.log(`${intToOutcome[x]}`);
  },
  seeTally: async (x) => {
    console.log(`${Who} tally is: ${x}`);
    console.log(`-----------------------------`);
  },
  seeTallys: async (x, y) => {
    console.log(`-->Player tally is ${x} \n-->Dealer tally is ${y}`);
  },
  seeOver: async (x, y) => {
    if(x > y){
      console.log(`Player wins the match!`);
    } else {
      console.log(`Dealer wins the match!`);
    }
  },
});

console.log('Starting backends...');
await Promise.all([
  backend.Player(ctcPlayer, {
    ...Shared('Player'),
    ...stdlib.hasRandom,
    wager: stdlib.parseCurrency(10),
    /*wager: async () => {
      const wager = await ask.ask(
        `How much would you like to wager?`,
        stdlib.parseCurrency
      );
      return wager;
    },*/
    getCard: async() => {
      const hit = await ask.ask(
        `Would you like another card?`,
        ask.yesno
      );
      if(hit){
        const card = Math.floor(Math.random() * 12) + 1;
        console.log(`You drew a ${cardDeck[card]}`);
        return card;
      } else return 0;
    },
    acceptWager: async (wager) => {
      const accepted = await ask.ask(
        `Do you accept the table bet of ${fmt(wager)} ALGOs?`,
        ask.yesno
      );
      if(!accepted){process.exit(0)};
    },
  }),
  backend.Dealer(ctcDealer, {
    ...Shared('Dealer'),
    ...stdlib.hasRandom,
    wager: stdlib.parseCurrency(10),
    seeFirst: (x) => {
      console.log(`Dealers first card shows ${cardDeck[x]}`);
    },
    autoCard: async () => {
      const nextCard = Math.floor(Math.random() * 12) + 1;
      console.log(`Dealer drew a ${cardDeck[nextCard]}`);
      return nextCard;
    },
  }),
]);

console.log('Goodbye, Player');
