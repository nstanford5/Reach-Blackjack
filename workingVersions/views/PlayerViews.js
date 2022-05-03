import React from 'react';

const exports = {};

// Player views must be extended
// It does not have its own Wrapper view

exports.GetHand = class extends React.Component {
  render() {
    // declare constant object

    return (
      <div>
        <button
          disabled={!playable}
          onClick={() => parent.nextCard()}
        >Hit</button>
        <button
          disabled={!playable}
          onClick={() => parent.stayButton()}
        >Stay</button>
      </div>
    );
  }
}

exports.WaitingForResults = class extends React.Component {
  render() {
    return (
      <div>
        Waiting for results...
      </div>
    );
  }
}

exports.Done = class extends React.Component {
  render() {
    const {outcome} = this.props;
    return (
      <div>
        The outcome of the hand was:
        <br />{outcome || 'Invalid'}
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return(
      <div>
        Timeout. Someone took too long.
      </div>
    );
  }
}

export default exports;
