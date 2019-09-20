import React from 'react';

class Counter extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            className : ""
        }
    }

    animateButton = (e) => {
        e.preventDefault();
        
        
        this.setState({
            className : "animate"
        })
        
        setTimeout(() => {
            this.setState({
                className : ""
            })
        },700);

        this.props.onClick();
      };

    render(){
        return (
            <button className={"bubbly-button " + this.state.className} onClick = {this.animateButton}>One up the BEER</button>
        );
    }
}

export default Counter;