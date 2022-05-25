import React from 'react';

const exports = {};

exports.Wrapper = class extends React.Component {
  render() {
    const {content} = this.props;
    return (
      <div className="App">
        <header className="App-header" id="root">
          <h1>Blackjack</h1>
          {content}
        </header>
      </div>
    );
  }
}

exports.ConnectAccount = class extends React.Component {
  render() {
    return (
      <div className="Game">
        Please wait while we connect your account.
      </div>
    )
  }
}

exports.DeployerOrAttacher = class extends React.Component {
  render() {
    const {parent} = this.props;
    return (
      <div>
        Please select a role:
        <br />
        <p>
          <button onClick={() => parent.selectDeployer()}>Deployer / Player</button>
          <br/>Set the wager, Deploy the contract, Players rules
        </p>
        <p>
          <button onClick={() => parent.selectAttacher()}>Attacher / Dealer</button>
          <br/>Attach to the Deployer's contract, Dealers rules, EXTRA FEE
        </p>
      </div>
    );
  }
}

exports.Rules = class extends React.Component {
  render () {
    const {parent} = this.props;
    return (
      <div className="Game">
        <h2>Welcome to Blackjack
          <br/>
          Game Rules
        </h2>
        <ul>
          <li>Each player gets two cards at the start -- one is publish, the other hidden</li>
          <li>Player goes first and can choose to Hit/Stay</li>
          <li>Players turn ends when they choose to stay or their total breaks 21</li>
          <li>Dealer goes next and can choose to Hit/Stay</li>
          <li>Dealer turn ends when they choose to stay or their total breaks 21</li>
          <li>Winner recieves the balance of the contract</li>
          <li>If the game is a draw - each the Player and Dealer wagers are returned to them</li>
        </ul>
        <button onClick={() => parent.afterRules()}>Accept Rules</button>
      </div>
    );
  }
}

export default exports;
