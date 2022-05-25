import React from 'react';

const exports = {};

exports.Wrapper = class extends React.Component{
  render() {
    const {content} = this.props;
    return (
      <div className="Deployer">
        {content}
      </div>
    );
  }
}

exports.GetCard = class extends React.Component {
  render() {
    const {parent, playable, handOne, handTwo} = this.props;
    return(
      <div className="Game">
          Your cards:
          <br />{handOne}
          <br />
      <button
        disabled={(!playable)}
        onClick={() => parent.playHand(1)}
        >Hit</button>
      <button
        disabled={(!playable)}
        onClick={() => parent.playHand(0)}
        >Stay</button>
      </div>
      
    );
  }
}

exports.Done = class extends React.Component{
  render() {
    const {outcome} = this.props;
    const {handOne, handTwo, pTotal, dTotal } = this.props;
    return (
      <div className="Game">
        Your cards:
          <br/> {handOne}
          <br/> Their cards:
          <br/> {handTwo}
          <br/>
        <br/> {outcome || 'Determining the winner..'}
        <br/>
        <br/>
        Your Total:
          <br/> {pTotal || "Calculating.."}
          <br/> Their Total:
          <br/> {dTotal || 'Calculating..'}
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return (
      <div className="Game">
        There's been a timeout. Someone took too long..
      </div>
    );
  }
}
export default exports;
