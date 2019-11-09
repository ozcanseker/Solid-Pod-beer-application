import React from 'react';
import "./css/List.scss";

class ListItem extends React.Component{
    render(){
      let beer = this.props.value === 1 ? "BEER" : "BEERS";
  
      return (
        <div className = "record">
          <p className = "topRecord">
            {this.props.date}
          </p>
            <div className= "bottomRecordWrapper">
                <p className = "bottomRecord">
                    {this.props.value} {beer}
                </p>
            </div>
        </div>
      );
    }
  }

export default ListItem;