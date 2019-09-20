import React from 'react';

class ListItem extends React.Component{
    render(){
      let beer = this.props.value === 1 ? "BEER" : "BEERS";
  
      return (
        <div className = "record">
          <p className = "topRecord">
            on {this.props.date} you drank
          </p>
          <p className = "bottomRecord">        
            {this.props.value} {beer}
          </p>
        </div>
      );
    }
  }

export default ListItem;