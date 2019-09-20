import React from 'react';

class Today extends React.Component{
  render(){
    let beer = this.props.beers === 1 ? "BEER" : "BEERS";

    return (
      <div className = "today">
        <p>Today You Drank</p>
        <p className = "amount"><span className = "todayBeer">{this.props.beers} {beer}</span></p>
      </div>
    );
  }
}

export default Today;