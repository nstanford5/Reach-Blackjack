import React from 'react';

const exports = {};

exports.Wrapper = class extends React.Component {
  render() {
    const {content} = this.props;
    return (
      <div className="App">
        <header className="App-header" id="root">
          <h1>BlackJack</h1>
          {content}
        </header>
      </div>
    );
  }
}

exports.ConnectAccount = class extends React.Component {
  render() {
    return(
      <div>
        Please wait while we connect your account...
        This should only take a few seconds
      </div>
    );
  }
}

exports.FundAccount = class extends React.Component {
  render() {
    const {bal, standardUnit, defaultAmt, parent} = this.props;
    const amt = (this.state || {}).amt || defaultFundAmt;
    return (
      <div>
        <h2>Fund account</h2>
        <br />
        Balance: {bal} {standardUnit}
        <hr />
        Would you like to fund your account with additional {standardUnit}?
        <br />
        (This only works on certain devnets)
        <br />
        <input 
          type='number'
          placeholder={defaultFundAmt}
          onChange={(e) => this.setState({amt: e.currentTarget.value})}
        />
        <button onClick={() => parent.fundAccount(amt)}>Fund Account</button>
        <button onClick={() => parent.skipFundAccount()}>Skip</button>
      </div>
    );
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
          <button
            onClick={() => parent.selectDeployer()}
          >Dealer</button>
          <br /> Let's start a game
        </p>
        <p>
          <button
            onClick={() => parent.selectAttacher()}
          >Player</button>
          <br /> Accept a challenge
        </p>
      </div>
    );
  }
}

export default exports;
