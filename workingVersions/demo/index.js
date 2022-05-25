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
const intToOutcome = ['Player Wins!', 'Dealer Wins!', 'Draw'];
var pHand = [];
var dHand = ['X'];
var wFlag;


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
  async seeOutcome(x, pSum, dSum){
    const pTotal = parseInt(pSum);
    const dTotal = parseInt(dSum);
    

    this.setState({
      view: 'Done',
      outcome: intToOutcome[x],
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
  termsAccepted() {
    this.state.resolveAcceptedP();
    this.setState({view: 'WaitingForTurn'});
  }
  render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);
