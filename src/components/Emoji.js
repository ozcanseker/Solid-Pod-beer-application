import React from "react";

class Emoji extends React.Component {
    render() {
        return (
            <span
                className="emoji"
                role="img"
                aria-label={this.props.label ? this.props.label : ""}
                aria-hidden={this.props.label ? "false" : "true"}
                style={{"font-size": "4em"}}
            >
                {this.props.symbol}
            </span>);
    }
}

export default Emoji;