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
    const {parent, playable, handOne, handTwo, wFlag, pGames, dGames, buttonOn} = this.props;
    return(
      <div className="Game">
        <div style={{
          position: 'absolute',
          right: 5,
          top: 5,
        }}>
          <strong>First to 3 hands wins</strong>
          <br/>
          Your Wins:{pGames}
          <br/>
          Their Wins:{dGames}
        </div>   
          Your cards:
          <br />{handOne}
          <br />
          <br/> Their cards:
          <br/>{handTwo}
          <br />
      <button
        disabled={(wFlag == 0 ? false : !playable)}
        onClick={() => parent.playHand(1)}
        >Hit</button>
      <button
        disabled={(wFlag == 0 ? false : !playable)}
        onClick={() => parent.playHand(0)}
        >Stay</button>
      <button
        disabled={!buttonOn}
        onClick={() => parent.aceAction(0)}
      >High</button>
      <button
        disabled={!buttonOn}
        onClick={() => parent.aceAction(1)}
      >Low</button>
      </div>
      
    );
  }
}

exports.Done = class extends React.Component{
  render() {
    const {outcome} = this.props;
    const {handOne, handTwo, pTotal, dTotal, pGames, dGames, matchOut} = this.props;
    return (
      <div className="Game">
        <div style={{
          position: 'absolute',
          right: 5,
          top: 5,
        }}>
          <strong>First to 3 hands wins</strong>
          <br/>
          Your Wins: {pGames}
          <br/>
          Their Wins: {dGames}
          <br/>
        </div>
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
        <br/>
        <br/>
        Match status:
        <br/> {matchOut} 
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
