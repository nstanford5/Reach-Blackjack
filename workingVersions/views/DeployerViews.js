import React from "react";
import PlayerViews from "./PlayerViews";

const exports = {...PlayerViews};


exports.Wrapper = class extends React.Component {
  render() {
    const {whatContent} = this.props;
    return (
      <div className="App">
        <header className="App-header" id="root">
          <h1>Fortune Reciever</h1>
          {whatContent}
        </header>
      </div>
    );
  }
}

exports.SetWager = class extends React.Component {
  render(){
    const {parent, defaultWager, standardUnit} = this.props;
    const wager = (this.state || {}).wager || defaultWager;
    return (
      <div>
        <input 
          type='number'
          placeholder={defaultWager}
          onChange={(e) => this.setState({wager: e.currentTarget.value})}
        /> {standardUnit}
        <br />
        <button 
          onClick={() => parent.setWager(wager)}
        >Set wager</button>
      </div>
    );
  }
}

exports.Deploy = class extends React.Component {
  render() {
    const {parent, wager, standardUnit} = this.props;
    return(
      <div>
        Wager (pay to deploy): {wager} {standardUnit}
        <br />
        <button
          onClick={() => parent.deploy()}
        >Deploy</button>
      </div>
    );
  }
}

exports.Deploying = class extends React.Component {
  render() {
    return(
      <div>Deploying... please wait</div>
    );
  }
}

exports.WaitingForAttacher = class extends React.Component {
  render() {
    const {ctcInfoStr} = this.props;
    return (
      <div>
        Waiting for the Fortune Teller
        <br /> Please give them this contract info:
        <pre className='ContractInfo'>
          {ctcInfoStr}
        </pre>
      </div>
    );
  }
}

export default exports;
