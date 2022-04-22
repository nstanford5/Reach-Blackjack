'reach 0.1';

const [isCard, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE] = makeEnum(13);
const [gameOutcome, PLAYER_WINS, DEALER_WINS, DRAW] = makeEnum(3);


// here is the game logic
// start small and build up
const winner = (playerHand, dealerHand) => {
  if (playerHand > dealerHand){
    const realOutcome = PLAYER_WINS;
    return realOutcome;
  } else {
    if (dealerHand > playerHand){
      const realOutcome = DEALER_WINS;
      return realOutcome;
    } else {
      const realOutcome = DRAW;
      return realOutcome;
    }
  }
};

// add asserts here
assert(winner(TWO, FOUR) == DEALER_WINS);
assert(winner(FOUR, TWO) == PLAYER_WINS);
assert(winner(TWO, TWO) == DRAW);

// add forall here
forall(UInt, playerHand =>
  forall(UInt, dealerHand =>
    assert(gameOutcome(winner(playerHand, dealerHand)))));



// shared Player method signatures
const Player = {
  ...hasRandom,
  getCard: Fun([], UInt),
  seeOutcome: Fun([UInt], Null),
  informTimeout: Fun([], Null),
};

export const main = Reach.App(() => {

  const Shark = Participant('Shark', {
    ...Player,
    wager: UInt,
    deadline: UInt,
  });

  const Dealer = Participant('Dealer', {
    ...Player,
    acceptWager: Fun([UInt], Null),
  });

  init();

  const informTimeout = () => {
    each([Shark, Dealer], () => {
      interact.informTimeout();
    });
  };

  Shark.only(() => {
    const wager = declassify(interact.wager);
    const deadline = declassify(interact.deadline);
  });

  Shark.publish(wager, deadline)
    .pay(wager);
  commit();

  Dealer.only(() => {
    interact.acceptWager(wager);
  });

  Dealer.pay(wager)
    .timeout(relativeTime(deadline), () => closeTo(Shark, informTimeout));

  var outcome = DRAW;

  invariant(balance() == 2 * wager && gameOutcome(outcome));

  while (outcome == DRAW){
    commit();

    Shark.only(() => {
      // create private card value
      const _sharkCardA = interact.getCard();
      const _sharkCardB = interact.getCard();

      // create salt and commit values
      const [_commitA, _saltA] = makeCommitment(interact, _sharkCardA);
      const commitA = declassify(_commitA); // publish hashed commit value

      const [_commitB, _saltB] = makeCommitment(interact, _sharkCardB);
      const commitB = declassify(_commitB);
    });

    Shark.publish(commitA, commitB)
      .timeout(relativeTime(deadline), () => closeTo(Dealer, informTimeout));
    commit();

    unknowable(Dealer, Shark(_sharkCardA, _saltA, _sharkCardB, _saltB));

    Dealer.only(() => {
      const _dealerCardA = interact.getCard();
      const _dealerCardB = interact.getCard();
      const cardA = declassify(_dealerCardA);
      const cardB = declassify(_dealerCardB);
    });

    Dealer.publish(cardA, cardB)
      .timeout(relativeTime(deadline), () => closeTo(Shark, informTimeout));
    commit();

    Shark.only(() => {
      const [saltA, sharkCardA] = declassify([_saltA, _sharkCardA]);
      const [saltB, sharkCardB] = declassify([_saltB, _sharkCardB]);
    });

    Shark.publish(saltA, sharkCardA, saltB, sharkCardB)
      .timeout(relativeTime(deadline), () => closeTo(Dealer, informTimeout));
    checkCommitment(commitA, saltA, sharkCardA);
    checkCommitment(commitB, saltB, sharkCardB);

    const playerTotal = sharkCardA + sharkCardB;
    const dealerTotal = cardA + cardB;

    outcome = winner(playerTotal, dealerTotal);
    continue;
  };

  assert(outcome == PLAYER_WINS || outcome == DEALER_WINS);
  transfer(2 * wager).to(outcome == PLAYER_WINS ? Shark : Dealer);
  commit();

  each([Shark, Dealer], () => {
    interact.seeOutcome(outcome);
  });
  exit();
});
