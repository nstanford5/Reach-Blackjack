'reach 0.1';

// todo: implement timeout
// todo: calculate sums in backend
// todo: implement limit on wager amount (frontend? given from Dealer?)
const DEADLINE = 20;
const cardValue = (x) => (x < 10 ? x : 10);
const myFromMaybe = (m) => fromMaybe(m, (() => 0), ((x) => x))
const getCard = () => {
}

export const main = Reach.App(() => {
  setOptions({ untrustworthyMaps: true });
  const D = Participant('Dealer', {
    ...hasRandom,
    bank: UInt,
    ready: Fun([], UInt),
    getCard: Fun([], UInt),
    showCards: Fun([Address, UInt, UInt], Null),
    showTotalA: Fun([Address, UInt], Null),
    showTotalB: Fun([Address, UInt], Null),
  });
  const P = API('Player', {
    // Specify Bob's interact interface here
    // inputWager: Fun([UInt], Null), <-- show how you would have to write this
    //        function if not for pay abstraction in return of api call
    startGame: Fun([UInt, UInt, UInt], Object({
      addr: Address, amt: UInt, c1: UInt, c2: UInt, total: UInt
    })),
    getCard: Fun([UInt], Object({
      addr: Address, amt: UInt, c1: UInt, c2: UInt, total: UInt
    })),
    //timesUp: Fun([], Bool),
  });
  const V = View('V', {
    vDealer: Address,
    vBank: UInt,
    getPlayer: Fun([Address], Object({
      amt: UInt, c1: UInt, c2: UInt, total: UInt
    }))
  });
  init();

  D.only(() => {
    const  _dCard = interact.ready();
    const [_commitD, _saltD ] = makeCommitment(interact, _dCard);
    const commitD = declassify(_commitD);
    const dCard2 = declassify(interact.getCard());
    const bank = declassify(interact.bank);
  })

  D.publish(commitD, dCard2, bank)
    .pay(bank);
  
  const players = new Map(Address, Object({
    addr: Address,
    amt: UInt,
    c1: UInt,
    c2: UInt,
    total: UInt,
  }));
  const pSet = new Set();
  V.vDealer.set(D);
  V.vBank.set(bank);
  //V.getPlayer.set(fromMaybe(players[this], {addr: D, amt: 0, c1: 0, c2: 0, total: 0}));
  //const limit = bank / 2;
  //const end = thisConsensusTime() + 20;
  const [ count ] = parallelReduce([ 0 ])
    .invariant(balance() == balance())
    .while(count < 4)
    .api_(P.startGame, (card1, card2, wager) => {
      return[wager, (ret) => {
        const who = this;
        pSet.insert(who);
        const sum = add(cardValue(card1), cardValue(card2));
        players[who] = {
          addr: who,
          amt: wager,
          c1: card1,
          c2: card2,
          total: sum,
        };
        if(sum == 21){
          // blackjack
          // todo
          transfer(add(wager, (bank/100))).to(who);
        } else {
          // hit/stay?
          // todo
          if(sum < 15){
            // hit
            // todo
          } else {
            // stay
            // todo
          }
        }
        /**
         * players[who] is an optional type, a Maybe value.
         * It is either None or Some, depending on contents. You need to consume
         * the Some value with fromSome which takes 2 arguments (Maybe, default if None)
         */

        //D.interact.showPlayer(fromSome(players[who], 
          //{ addr: who, amt: wager, c1: card1, c2: card2, total: sum}));
        ret(fromSome(players[who],
          { addr: who, amt: wager, c1: card1, c2: card2, total: sum }));// return the sum to the frontend
          // count players who are over 14
          //const b = (sum < 14 ? count : (count + 1));
          //D.interact.showTotalA(this, sum);
          return[ (sum < 14 ? count : count + 1) ];
      }];
    })
    .api_(P.getCard, (nCard) => {
      return[0, (ret) => {
        // this doesn't work. I think its because it can be called by someone not in the list?
        //check(isNone(pSet.member(this)), "sorry, not in the list");
        const who = this;
        const pObj = fromSome(players[who],
          {addr: this, amt: 0, c1: 0, c2: 0, total: 0});
        const total = pObj.total + cardValue(nCard);
        players[who] = {
          addr: who,
          amt: pObj.amt,
          c1: pObj.c1,
          c2: pObj.c2,
          total: total,
        };
        ret(fromSome(players[who], {
          addr: who,
          amt: pObj.amt,
          c1: pObj.c1,
          c2: pObj.c2,
          total: total,
        }));
        //const t = (total < 14 ? count : (count + 1));
        //D.interact.showTotalB(this, total);
        return [ (total < 14 ? count : count + 1) ];
      }];
    })
    /*
    .timeout(DEADLINE, () => {
      const [[], ret] = call(P.timesUp);
      ret(true);
      return[count];
    })*/

  commit();
  D.only(() => {
    const saltD = declassify(_saltD);
    const dCard = declassify(_dCard);
    interact.showCards(this, dCard, dCard2);
  });
  D.publish(saltD, dCard);
  checkCommitment(commitD, saltD, dCard);

  var [
    dTotal, 
    dAces,
    keepGoing
  ]  =  [
    cardValue(dCard) + cardValue(dCard2), 
    (dCard == 1 ? 1 : 0) + (dCard2 == 1 ? 1 : 0),
    true
  ];
  invariant(balance() == balance());
  while(keepGoing){
    if(dTotal > 21 && dAces > 0){
      commit();
      D.publish();
      [dTotal, dAces, keepGoing] = [dTotal - 1, dAces - 1, true];
      continue;
    } else {
      if(dTotal < 17){
        commit();
        D.only(() => {
          const nCard = declassify(interact.getCard());
        })
        D.publish(nCard); 
        [dTotal, dAces, keepGoing] = [add(dTotal, cardValue(nCard)), dAces + (nCard == 1 ? 1 : 0), true];
        continue;
      } else {
        // should I publish the state here? A num to represent array index
        commit();
        D.publish();
        [keepGoing] = [false];
        continue;
      }
    }
  }
  D.interact.showTotalA(D, dTotal);
  transfer(balance()).to(D);
  commit();
  exit();
});
