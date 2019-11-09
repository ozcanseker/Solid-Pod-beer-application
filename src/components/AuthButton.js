import React from 'react';
import Button from '@material-ui/core/Button';

class LogOutButton extends React.Component{
    render(){
      return(
          <Button variant="contained" color="primary" >
              Primary
          </Button>
        // <button onClick = {this.props.onClick} className = "authButton">Log Out</button>
      );
    }
  }

export default LogOutButton;