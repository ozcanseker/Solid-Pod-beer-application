import React from 'react';
import ListItem from './ListItem';

class List extends React.Component{
    render(){
      let listDates = this.props.beerCounter.getOrderedDateList();
      let list = listDates.map(date => <ListItem key = {date} date = {date} value = {String(this.props.beerCounter.getValueOnDate(date)).padStart(2, '0')}></ListItem>);
      return (
        <div className = "listContainer">
          {list}
          <br/>
          <br/>
        </div>
      );
    }
  }

export default List;