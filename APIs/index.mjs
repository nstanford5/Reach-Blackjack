import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib({ REACH_NO_WARN: 'Y'});

const startingBalance = stdlib.parseCurrency(1000);
const accDealer = await stdlib.newTestAccount(stdlib.parseCurrency(5000));

const deck = {1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'};
const choices = ['Stay', 'Hit'];

console.log("Hello Players! Have a seat, let's play blackjack!");

console.log('Launching...');
const ctcDealer = accDealer.contract(backend);

const drawCard = () => {
  const c = Math.floor(Math.random() * 12) + 1;
  return c;
}
const fmt = (x) => stdlib.formatCurrency(x, 4);
const cardValue = (x) => (x < 10 ? x : 10);
const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
const beforeDealer = await getBalance(accDealer);

const startPlayers = async () => {
  const runPlayers = async (who) => {
    const acc = await stdlib.newTestAccount(startingBalance);
    const ctc = acc.contract(backend, ctcDealer.getInfo());
    const accBefore = await getBalance(acc);
    const hand = {
      card1: drawCard(),
      card2: drawCard(),
      wager: stdlib.parseCurrency(Math.floor(Math.random() * 90) + 10)
    }
    const pObj = await ctc.apis.Player.startGame(hand.card1, hand.card2, hand.wager);
    console.log(`Player summary of: ${stdlib.formatAddress(pObj.addr)}
       Wager: ${stdlib.formatCurrency(pObj.amt)}
       1st Card: ${deck[pObj.c1]}
       2nd Card: ${deck[pObj.c2]}
       Initial Total: ${pObj.total}`);
    // this returns some, microUnits for vBank
    const num = await ctc.views.V.vBank();
    console.log(`Test ${stdlib.formatCurrency(num[1])}`);
    while(pObj.total < 14){
      const nCard = drawCard();
      const nObj = await ctc.apis.Player.getCard(nCard);
      pObj.total = nObj.total;
      console.log(`${stdlib.formatAddress(acc)} next card is: ${deck[nCard]}
        for a new total of: ${pObj.total}`);
    }
  }
  await runPlayers('One');
  await runPlayers('Two');
  await runPlayers('Three');
  await runPlayers('Four');
}

console.log('Starting backends...');
await Promise.all([
  backend.Dealer(ctcDealer, {
    ...stdlib.hasRandom,
    bank: stdlib.parseCurrency(2000),
    ready: async () => {
      startPlayers();
      return drawCard();
    },
    getCard: () => {
      const c = drawCard();
      console.log(`Dealer drew a ${deck[c]}`);
      return c;
    },
    showCards: (who, c1, c2) => {
      if(who === accDealer.getAddress()){
        console.log(`Dealer cards are ${deck[c1]} and ${deck[c2]}`);
      } else {
        const sum = cardValue(parseInt(c1)) + cardValue(parseInt(c2));
        console.log(`${stdlib.formatAddress(who)} drew a ${deck[c1]} and ${deck[c2]}
          for a total of ${sum}`);
      }
    },
    showTotalA: async (who, sum) => {
      if(who === accDealer.getAddress()){
        console.log(`Dealer total is ${parseInt(sum)}`);
      } else {
        console.log(`Get Card total of ${stdlib.formatAddress(who)} cards is ${parseInt(sum)}`);
      }
    },
    showTotalB: async (who, sum) => {
      console.log(`Get Card total of ${stdlib.formatAddress(who)} cards is ${parseInt(sum)}`);
    },
  }),
]);
console.log('Casino is closing!');
