/**
 * Blackjack
 * 
 * The Objective is to be the closest player to 21 without going over.
 * Player goes first and chooses hit / stay. Hit returns another card 
 * to be added to the sum, stay locks in the current sum and begins 
 * the Dealers interaction. The Dealers play is autonomous. The dealer 
 * will continue to draw cards until their sum is greater than the player
 * or the sum exceeds 21.
 * 
 * Author: Nick Stanford
 * Date: 16 May 2022
 */

 'reach 0.1';

 const [ isOutcome, P_WINS, D_WINS, DRAW] = makeEnum(3);
 
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
   seeOutcome: Fun([UInt, UInt, UInt], Null),
   updateCards: Fun([UInt], Null),
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
 
   Dealer.only(() => {
     interact.acceptWager(wager);
   });
   
   // dealers extra fee goes in
   Dealer.pay(wager)
     .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));
     commit();     
 
     // players gets two cards, publishes one, one stays hashed
     Player.only(() => {
       const [_pFirst, _pSecond] = interact.startGame();
       const [_pCommit, _pSalt] = makeCommitment(interact, _pFirst);
       const pCommit = declassify(_pCommit);
       const pSecond = declassify(_pSecond);
     });
 
     // publish and commit to first two cards
     Player.publish(pCommit, pSecond)
       .timeout(relativeTime(DEADLINE), () => closeTo(Dealer, informTimeout));
     commit();
 
     // dealer gets two cards, publish one, one remains hashed
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
     
     // create sum for first cards
     // create flag variables
     var [pFlag, dFlag, pSum, dSum, pTurn, dTurn] = [1, 1, cardValue(pSecond), cardValue(dSecond), 0, 0];
     invariant(balance() == ((2 * wager)));
     while(pFlag == 1 || dFlag == 1) {
     

       // player gets to choose if they want another card
       if(pFlag == 1 && pSum < 21) {
         commit();
         
         // prompt user for another card
         // returns 0 if player stays
         unknowable(Player, Dealer(_dFirst));
         
         Player.only(() => {
           const pFirst = declassify(_pFirst);
           const pNext = declassify(interact.getCard());
         });
         Player.publish(pNext, pFirst)
           .timeout(relativeTime(DEADLINE), () => closeTo(Dealer, informTimeout));
 
         // log card to front end
         Dealer.only(() => {
           interact.updateCards(pNext);
         });
         
       // checks pNext for off status
       // updates pSum
       [pFlag, dFlag, pSum, dSum, pTurn] = [(pNext < 1 ? 0 : 1), 1, pSum + cardValue(pNext) + cardValue(pFirst), dSum, 1];
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
           interact.updateCards(dFirst);
         });
 
         // update dealer sum after publishing hidden card
         // check for dealer aces
         [dSum, dTurn] = [dSum + cardValue(dFirst), 1];
         continue; 
       } else { 
           // check if dealer needs to draw
               if (dSum < pSum && dSum < 21){
                 commit();
                 Dealer.only(() => {
                   const dNext = declassify(interact.getCard());
                 });
                 Dealer.publish(dNext)
                   .timeout(relativeTime(DEADLINE), () => closeTo(Player, informTimeout));
                 
                 // update Player front end with new card
                 Player.only(() => {
                   interact.updateCards(dNext);
                 });
         
                 // leave player flag off, check dealer next card
                 [dFlag, pSum, dSum] = [(dNext < 1 ? 0 : 1), pSum, (dSum + cardValue(dNext))];
                 continue;
               } else {
                  commit();
                  Dealer.publish();
                  [pFlag, dFlag] = [0, 0];
                  continue;
               }
            // end of dealer actions
         }
       }
     } // end of pFlag / dFlag loop
 
     // compute single hand outcome
     const outcome = winner(pSum, dSum);
 
     each([Player, Dealer], () => {
       interact.seeOutcome(outcome, pSum, dSum);
     });
 
   // transfer wagers and Fee to winner
   if(outcome == DRAW){
     transfer(wager).to(Player);
     transfer(wager).to(Dealer);
   } else {
    transfer((2 * wager)).to(outcome == P_WINS ? Player : Dealer);
   }
   
   commit();
   exit();
 });
