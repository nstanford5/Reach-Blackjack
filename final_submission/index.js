import React from 'react';
import AppViews from './views/AppViews.js';
import DeployerViews from './views/DeployerViews.js';
import AttacherViews from './views/AttacherViews.js';
import {renderDOM, renderView} from './views/render.js';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);

import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
reach.setWalletFallback(reach.walletFallback({
  providerEnv: 'TestNet', MyAlgoConnect}));

const { standardUnit } = reach;
const defaults = {defaultFundAmt: '10', defaultWager: '0', standardUnit };
const cardDeck = { 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K' };
const intToOutcome = ['Player Wins the Hand!', 'Dealer Wins the Hand!', 'Draw'];
var win = 'No winner yet';
var pHand = [];
var dHand = ['X'];
var wFlag;
var buttonOn = false;

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {view: 'ConnectAccount', ...defaults};
  }
  async componentDidMount() {
    const acc = await reach.getDefaultAccount();
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({view: 'Rules', acc, bal});
  }
  async fundAccount(fundAmount) {
    await reach.transfer(this.state.faucet, this.state.acc, reach.parseCurrency(fundAmount));
    const balAtomic = await reach.balanceOf(this.state.acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({view: 'Rules', bal, acc: this.state.acc});
  }
  async afterRules() { this.setState({view: 'DeployerOrAttacher'}); }
  selectAttacher() {
    this.setState({view: 'Wrapper', ContentView: Attacher});
  }
  selectDeployer() {
    this.setState({ view: 'Wrapper', ContentView: Deployer});
  }
  render() {return renderView(this, AppViews); }
}

class Shared extends React.Component {
  constructor(props){
    super(props);
    this.state = { view: 'ConnectAccount', 
      ...defaults,
      pAces: 0,
    };
  }
  random() { return reach.hasRandom.random(); }

  // after a hand is over, reset each hand array
  resetView() {

    this.setState({
      // my hand is empty
      handOne: pHand = [],
      // opponents hand shows X
      handTwo: dHand = ['X'],
    });
  }
  seeTallys(pTally, dTally){
    const pGames = parseInt(pTally);
    const dGames = parseInt(dTally);
    this.setState({
      // who is calling?
      pGames: (wFlag == 1 ? pGames : dGames),
      dGames: (wFlag == 0 ? pGames : dGames),
    });
    // update match outcome
    if(pGames == 3 || dGames == 3){
      this.setState({
        matchOut: (pGames > dGames ? "Player wins match!" : "Dealer wins match!"),
      });
    }
  }

  async getAceValue(x, pSum){
    const pTotal = parseInt(pSum);
    const aceTotal = parseInt(x);

    // prompt user for ace high / low
    const highLow = await new Promise(resolveAceP => {
      this.setState({
        view: 'GetCard',
        playable: false,
        buttonOn: true,
        pAces: aceTotal,
        resolveAceP,
      });
    });
    // Player chose ace low
    if(highLow == 1){
      this.setState({
        pSum: (pTotal - 10),
      });
    }
    // reduce the count of aces 
    this.setState({
      pAces: (aceTotal - 1),
    });
    // send the choice to the backend
    return highLow;
  }
  aceAction(x){
    this.state.resolveAceP(x ? 1 : 0);
    this.setState({
      buttonOn: false,
    });
  }
  async getCard() {
    var card = await new Promise(resolveHandP => {
      this.setState({
        view: 'GetCard',
        playable: true,
        resolveHandP,
        handOne: pHand.join(" "),
        handTwo: dHand.join(" "),
      });
    });
    // player chose hit
    if (card == 1){
      card = Math.floor(Math.random() * 12) + 1;
      pHand.push(cardDeck[card]);

      this.setState({
        view: 'GetCard',
        handOne: pHand.join(" "),
        handTwo: dHand.join(" "),
        playable: false,
      });
      return card;
      }
    else { // player chose stay
      this.setState({
        view: 'GetCard',
        handOne: pHand.join(" "),
        handTwo: dHand.join(" "),
        playable: false,
      });
      // flag off
      return 0;
    }
  }
  async startGame() {
    var hands = [];
    for(let i = 0; i < 2; i++){
      var card = Math.floor(Math.random() * 12) + 1;
      pHand.push(cardDeck[card]);
      hands.push(card);
    }
    this.setState({
      view: 'GetCard',
      playable: false,
      handOne: pHand.join(" "),
      handTwo: dHand.join(" "),
    });
    return [hands[0], hands[1]];
  }
  async seeOutcome(x, pSum, dSum, pTally, dTally){
    const pTotal = parseInt(pSum);
    const dTotal = parseInt(dSum);
    const pGames = parseInt(pTally);
    const dGames = parseInt(dTally);
    

    this.setState({
      view: 'Done',
      outcome: intToOutcome[x],
      matchOut: win,
      handOne: pHand.join(" "),
      handTwo: dHand.join(" "),
      standardUnit: defaults[2],
      pTotal: (wFlag == 1 ? pTotal : dTotal),
      dTotal: (wFlag == 0 ? pTotal : dTotal),
    });
  }
  informTimeout() { this.setState({view: 'Timeout'}); }
  playHand(x) {
    // which button did the player push?
    this.state.resolveHandP(x ? 1 : 0);
  }
  updateCards(x) {
    if (x != 0){
      dHand.push(cardDeck[x]);
    }
    this.setState({
      view: 'GetCard',
      handOne: pHand.join(" "),
      handTwo: dHand.join(" "),
      playable: false,
    });
  }
  showLast(x){
    dHand[0] = cardDeck[x];
  }
  seeOver() {
    this.setState({
      view: 'Done',
      handOne: pHand.join(" "),
      handTwo: dHand.join(" "),
      playable: false,
    });
  }
}

class Deployer extends Shared {
  constructor(props){
    super(props);
    this.state = {view: 'SetWager'};
  }
  setWager(wager) { this.setState({ view: 'Deploy', wager}); }
  async deploy() {
    const ctc = this.props.acc.contract(backend);
    this.setState({view: 'Deploying', ctc});
    this.wager = reach.parseCurrency(this.state.wager);
    backend.Player(ctc, this);
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
    this.setState({view: 'WaitingForAttacher', ctcInfoStr});
    wFlag = 1;
  }
  render() { return renderView(this, DeployerViews); }
}

class Attacher extends Shared {
  constructor(props){
    super(props);
    this.state = {view: 'Attach'};
  }
  attach(ctcInfoStr){
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
    this.setState({view: 'Attaching'});
    backend.Dealer(ctc, this);
    wFlag = 0;
  }
  async acceptWager(wagerAtomic) {
    const wager = reach.formatCurrency(wagerAtomic, 4);
    return await new Promise(resolveAcceptedP => {
      this.setState({view: 'AcceptTerms', wager, resolveAcceptedP});
    });
  }
  async autoCard() {
    var card = Math.floor(Math.random() * 12) + 1;
    pHand.push(cardDeck[card]);
    this.setState({
      view: 'GetCard',
      playable: false,
      handOne: pHand.join(" "),
      handTwo: dHand.join(" "),
    });
    return card;
  }
  termsAccepted() {
    this.state.resolveAcceptedP();
    this.setState({view: 'WaitingForTurn'});
  }
  render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);
