import React from 'react';
import Button from '@material-ui/core/Button';
import {withStyles} from "@material-ui/core";
import "./css/AuthButton.scss";


class AuthButton extends React.Component {
    render() {
        const ColorButton = withStyles(theme => ({
            root: {
                background: 'linear-gradient(45deg, #DCC17D 30%, #ddb74d 90%)',
                border: 0,
                borderRadius: 3,
                boxShadow: '0 2px 5px 2px rgba(150, 150, 50, .3)',
                color: 'white',
                height: 48,
                padding: '0 30px',
                margin: 8,
                float: "right"
            },
        }))(Button);

        let string;
        if (this.props.loggedIn) {
            string = "Log out"
        } else {
            string = "Log in"
        }

        return (
            <section className="authDiv">
                <ColorButton variant="contained" color="primary" onClick = {this.props.onClick}>
                    {string}
                </ColorButton>
            </section>
        );
    }
}

export default AuthButton;