import React from 'react';

class LogInButton extends React.Component{
    render(){
      return(
        <button onClick = {this.props.onClick} className = "authButton">Log In</button>
      );
    }
  }

  export default LogInButton;