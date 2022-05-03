import React from 'react';
import AppViews from './views/AppViews';
import DeployerViews from './views/DeployerViews';
import AttacherViews from './views/AttacherViews';
import {renderDOM, renderView} from './views/render';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);

import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
reach.setWalletFallback(reach.walletFallback({
  providerEnv: 'TestNet', MyAlgoConnect}));



const {standardUnit} = reach;
const defaults = {defaultFundAmt: '10', defaultWager: '1', standardUnit};
const cardDeck = { 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K' };
const intToOutcome = ['Player Wins!', 'Dealer Wins!', 'Draw!'];

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {view: 'ConnectAccount', ...defaults};
  }
  async componentDidMount() {
    const acc = await reach.getDefaultAccount();
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({acc, bal});
    if(await reach.canFundFromFaucet()){
      this.setState({view: 'FundAccount'});
    } else {
      this.setState({view: 'DeployerOrAttacher'});
    }
  }
  async fundAccount(fundAmount) {
    await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount));
    this.setState({view: 'DeployerOrAttacher'});
  }
  async skipFundAccount() {this.setState({view: 'DeployerOrAttacher'}); }
  selectAttacher() {this.setState({view: 'Wrapper', ContentView: Attacher}); } 
  selectDeployer() {this.setState({view: 'Wrapper', ContentView: Deployer}); } // this should launch the contract
  render() {return renderView(this, AppViews); }
}

// Shared functions
class Shared extends React.Component {
  // these are the function definitions
  // they mirror the backend
  random() { return reach.hasRandom.random(); }
  informTimeout() {this.setState({view: 'Timeout'}); }
  seeOutcome(i) { this.setState({view: 'Done', outcome: intToOutcome[i]}); }

  //implement these views:
  // startGame
  // seeTallys
  // seeOver
}

class Deployer extends Shared {
  constructor(props) {
    super(props);
    this.state = {view: 'SetWager'};
  }
  setWager(wager) {this.setState({view: 'Deploy', wager}); }
  async deploy() {
    const ctc = this.props.acc.contract(backend);
    this.setState({view: 'Deploying', ctc});
    this.wager = reach.parseCurrency(this.state.wager);
    this.deadline = { ETH: 10, ALGO: 100, CFX: 1000}[reach.connector];
    backend.Dealer(ctc, this);
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
    this.setState({view: 'WaitingForAttacher', ctcInfoStr});
  }
  render() { return renderView(this, DeployerViews); }
  // this is the end of the Deployer
}

class Attacher extends Shared {
  constructor(props){
    super(props);
    this.state = {view: 'Attach'};
  }
  attach(ctcInfoStr){
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
    this.setState({view: 'Attaching'});
    backend.Player(ctc, this);
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
  render() {return renderView(this, AttacherViews); }
}
renderDOM(<App />);
