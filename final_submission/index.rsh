/**
 * Blackjack
 * 
 * The Objective is to be the closest player to 21 without going over.
 * Player goes first and chooses hit / stay. Hit returns another card 
 * to be added to the sum, stay locks in the current sum and begins 
 * the Dealers interaction. The Dealers play is autonomous. The dealer 
 * will continue to draw cards until their sum is greater than the player
 * or the sum exceeds 21. The dealer pays an extra 5 ALGO fee for their
 * advantage as "the house". The contract is a match, first to 3 hands wins
 * the match and the balance of the contract is paid upon termination 
 * of the game.
 * 
 * Author: Nick Stanford
 * Date: 16 May 2022
 */

'reach 0.1';

const [ isOutcome, P_WINS, D_WINS, DRAW] = makeEnum(3);
const DEALER_FEE = 5000000;

// function to compute the winner
// takes in two sums
const winner = (pTotal, dTotal) => {
    
    if(pTotal > 21 || (dTotal < 22 && dTotal > pTotal)){
    return D_WINS;
  } else {
    if(pTotal < 22 && (pTotal > dTotal || dTotal > 21)){
      return P_WINS;
    } else return DRAW;
  }
}

assert(winner(20, 21) == D_WINS);
assert(winner(22, 15) == D_WINS);
assert(winner(19, 17) == P_WINS);
assert(winner(21, 20) == P_WINS);
assert(winner(14, 25) == P_WINS);
assert(winner(18, 18) == DRAW);
assert(winner(21, 21) == DRAW);


const Shared = {
  ...hasRandom,
  startGame: Fun([], Tuple(UInt, UInt)),
  informTimeout: Fun([], Null),
  getCard: Fun([], UInt),
  showLast: Fun([UInt], Null),
  seeOver: Fun([], Null),
  seeOutcome: Fun([UInt, UInt, UInt, UInt, UInt], Null),
  updateCards: Fun([UInt], Null),
  resetView: Fun([], Null),
  seeTallys: Fun([UInt, UInt], Null),
  getAceValue: Fun([UInt, UInt], UInt),
};

// this defaults ace to a high value, Player can choose high/low
// dealers sum will auto update with best value for their hand
const cardValue = (x) => (x == 1 ? 11 : (x < 10 ? x : 10))
const DEADLINE = 20;

export const main = Reach.App(() => {
  const Player = Participant('Player', {
    ...Shared,
    wager: UInt,
  });
  const Dealer = Participant('Dealer', {
    ...Shared,
    acceptWager: Fun([UInt], Null),
    autoCard: Fun([], UInt),
  });
  init();

  const informTimeout = () => {
    each([Player, Dealer], () => {
      interact.informTimeout();
    });
  };

  Player.only(() => {
    const wager = declassify(interact.wager);
  });

  Player.publish(wager)
    .pay(wager)
  commit();

  // dealer accepts all wagers
  Dealer.only(() => {
    interact.acceptWager(wager);
  });
  
  // dealers extra fee goes in
  Dealer.pay(wager + DEALER_FEE)
    .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));

  // outer loop for the match, exits when one participant wins 3rd hand
  var [pTally, dTally] = [0, 0];
  invariant(balance()== (2 * wager) + DEALER_FEE);
  while(pTally < 3 && dTally < 3){
    commit();
    
    // to display results screeen before cycling new hand
    wait(relativeTime(2));

    // update tally counts to front end
    // reset hand arrays 
    each([Player, Dealer], () => {
      interact.seeTallys(pTally, dTally);
      interact.resetView();
    });

    // players cards are not hidden, all cards are dealt face up
    Player.only(() => {
      const [pFirst, pSecond] = declassify(interact.startGame());
    });

    // publish and commit to first two cards
    Player.publish(pFirst, pSecond)
      .timeout(relativeTime(DEADLINE), () => closeTo(Dealer, informTimeout));
    commit();

    // dealer gets two cards, one remains hashed
    Dealer.only(() => {
      const [_dFirst, _dSecond] = interact.startGame();
      const [_dCommit, _dSalt] = makeCommitment(interact, _dFirst);
      const dCommit = declassify(_dCommit);
      const dSecond = declassify(_dSecond);
    });
    
    // Player can't know secret card here
    unknowable(Player, Dealer(_dFirst));
    
    Dealer.publish(dCommit, dSecond)
      .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));

    // update the other players front end
    Player.only(() => {
      interact.updateCards(dSecond);
    });
    Dealer.only(() => {
      interact.updateCards(pSecond);
    });
    
    // check for Ace in Players first two cards
    // create sum for Players first two cards
    // create flag variables
    var [pFlag, dFlag, pSum, dSum, pAces, dAces, pTurn, dTurn] = [1, 1, cardValue(pFirst) + cardValue(pSecond), cardValue(dSecond), (pFirst == 1 ? 1 : 0) + (pSecond == 1 ? 1 : 0), 0, 0, 0];
    invariant(balance() == ((2 * wager) + DEALER_FEE));
    while(pFlag == 1 || dFlag == 1) {
    
      // if the player has at least once Ace, let them choose
      if(pAces > 0){
        commit();
        unknowable(Player, Dealer(_dFirst));
        
        // prompt user if they want high / low
        Player.only(() => {
          const aceValue = declassify(interact.getAceValue(pAces, pSum));
        });
        
        // publish the choice of their ace value
        Player.publish(aceValue);

        // player chose ace low
        if(aceValue == 1){
          [pSum, pAces] = [pSum - 10, pAces - 1];
          continue;
        }
        // player chose ace high
        [pAces] = [pAces - 1];
        continue;
      }
      // player gets to choose if they want another card
      if(pFlag == 1 && pSum < 21) {
        commit();
        
        // prompt user for another card
        // returns 0 if player stays
        unknowable(Player, Dealer(_dFirst));
        
        Player.only(() => {
          const pNext = declassify(interact.getCard());
        });
        Player.publish(pNext)
          .timeout(relativeTime(DEADLINE), () => closeTo(Dealer, informTimeout));

        // log card to front end
        Dealer.only(() => {
          interact.updateCards(pNext);
        });
        
      // checks pNext for off status
      // updates pSum
      // check pNext for Ace
      [pFlag, dFlag, pSum, dSum, pTurn, pAces] = [(pNext < 1 ? 0 : 1), 1, pSum + cardValue(pNext), dSum, 1, (pNext == 1 ? pAces + 1 : pAces)];
      continue; // end player logic
      } else {// start dealer logic
      
      // if this is the first time through, update Dealers total with hidden card
      if(dTurn == 0){
        commit();
        
        // dealer can now reveal hidden card
        Dealer.only(() => {
          const dFirst = declassify(_dFirst);
        });
        Dealer.publish(dFirst)
          .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));
        
        // update front end
        Player.only(() => {
          interact.showLast(dFirst);
        });

        // update dealer sum after publishing hidden card
        // check for dealer aces
        [dSum, dTurn, dAces] = [dSum + cardValue(dFirst), 1, (dFirst == 1 ? 1 : 0) + (dSecond == 1 ? 1 : 0)];
        continue; 
      } else { 
      
        // did player draw 21 on first hand?
        // did player bust?
        if((pTurn == 0 && pSum == 21) || pSum > 21){
          commit();
          Dealer.publish();
          
          // hand over turn both flags off
          [pFlag, dFlag] = [0, 0];
          continue;
        } else {
        
          // dealer busts but has an ace
          if(dSum > 21 && dAces > 0){
            commit();
            Dealer.publish();
            
            // make the ace low, subtract 1 from ace count
            [dSum, dAces] = [dSum - 10, dAces - 1]
            continue;
          } else { // check if dealer needs to draw
          
              if (dSum < pSum && dSum < 21){
                commit();
                Dealer.only(() => {
                  // dealer doesn't get to choose hit / stay
                  const dNext = declassify(interact.autoCard());
                });
                Dealer.publish(dNext)
                  .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));
                
                // update Player front end with new card
                Player.only(() => {
                  interact.updateCards(dNext);
                });
        
                // add card to dSum, leave dealer flag on, check for Ace
                [pFlag, dFlag, pSum, dSum, dAces] = [pFlag, 1, pSum, (dSum + cardValue(dNext)), (dNext == 1 ? dAces + 1 : dAces)];
                continue;
              } else {//dealer is in a position to win
              commit();
              Dealer.publish();
              
              // turn dealer flag off
              [dFlag] = [0];
              continue;
              } 
            } 
          } // end of dealer actions
        }
      }
    } // end of pFlag / dFlag loop

    Dealer.only(() => {
      interact.showLast(pFirst);
    });

    // compute single hand outcome
    const outcome = winner(pSum, dSum);

    each([Player, Dealer], () => {
      interact.seeOutcome(outcome, pSum, dSum, pTally, dTally);
    });

    if(outcome == 0){
      // player wins, increment pTally
      [pTally, dTally] = [pTally + 1, dTally];
      continue;
    } else {
      if (outcome == 1){
        // dealer wins, increment dTally
        [pTally, dTally] = [pTally, dTally + 1];
        continue;
      } else {
        // draw don't update tallys
        [pTally, dTally] = [pTally, dTally];
        continue;
      }
    }
}
  // update front end with tally count at the end of the match
  each([Player, Dealer], () => {
    interact.seeTallys(pTally, dTally);
  });

  // transfer wagers and Fee to winner
  transfer((2 * wager) + DEALER_FEE).to(pTally > dTally ? Player : Dealer);
  commit();
  exit();
});
