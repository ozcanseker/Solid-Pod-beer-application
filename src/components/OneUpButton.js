import React from 'react';
import "./css/OneUpButton.scss";


class OneUpButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="oneUpButtonContainer">
                <div className="containerCircleBorder" onClick={this.props.onClick}>
                    <div className="oneUpButtonCircle">
                        <div className="circleBorder">
                            <div className="innerCircle">
                                <div className="oneUpButton"><p>One up the BEER</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default OneUpButton;