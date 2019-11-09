import React from 'react';
import './App.scss';
import OneUpButton from './components/OneUpButton';
import List from './components/List';
import Today from './components/Today';
import AuthButton from './components/AuthButton'

import SolidCommunicator from './netwerk/SolidCommunicator';
import BeerCounter from './model/BeerCounter'
import Bubbles from "./components/Bubbles";

import * as authClient from 'solid-auth-client';
import AccessError from "./error/AccessError";
import Emoji from "./components/Emoji";
import {BeatLoader, BounceLoader} from "react-spinners";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false,
            error: undefined,
            accessError: undefined
        }
    }

    componentDidMount() {
        this.checkForLogin();
    }

    checkForLogin = () => {
        if (this.state.beerCounter) {
            this.state.beerCounter.unsubscribe();
        }

        authClient.currentSession().then(session => {
            let beerCounter = new BeerCounter();
            beerCounter.subscribe(this);

            if (session) {
                this.setState({
                    isLoggedIn: true,
                    beerCounter: beerCounter,
                    hasFetched: false
                });

                SolidCommunicator.build(beerCounter).then(aa => {
                    this.setState({
                        hasFetched: true,
                        amountOfBeersToday: this.state.beerCounter.getBeerCount(),
                        dateToday: this.state.beerCounter.getDateToday()
                    });
                }).catch(e => {
                    if (e instanceof AccessError) {
                        this.setState({
                            accessError: true
                        })
                    }
                    this.setState({
                        error: true,
                        fetchingFiles: false
                    })
                });
            } else {
                this.setState({
                    isLoggedIn: false
                });
            }
        })
    };

    update = () => {
        this.setState({
            amountOfBeersToday: this.state.beerCounter.getBeerCount(),
            dateToday: this.state.beerCounter.getDateToday()
        });

    }

    handleLogIn = () => {
        let popupUri = './popup.html';
        authClient.popupLogin({popupUri}).then(() => {
            this.checkForLogin();
        })
    }

    handleLogOut = () => {
        authClient.logout()
            .then(
                this.setState({isLoggedIn: false})
            );
    }

    increaseBeers = () => {
        this.state.beerCounter.increaeCountToday();
    }

    render() {
        let section;
        let bubbles;

        if (this.state.isLoggedIn) {
            if (this.state.error) {
                let message;

                if (this.state.accessError) {
                    message = "The application does not have correct access, " +
                        "Please fix this by giving this application Read, Write and Append access in your pod."
                    ;
                } else {
                    message = "Try refreshing the page.";
                }

                section = (
                    <div className="error">
                        <Emoji symbol="😔"/>
                        <p>
                            Something went wrong<br/><br/>
                            {message}
                        </p>
                    </div>
                );

            } else if (this.state.hasFetched) {
                let list = <List beerCounter={this.state.beerCounter}/>
                let counter = <OneUpButton onClick={this.increaseBeers}/>
                let today = <Today date={this.state.dateToday} beers={this.state.amountOfBeersToday}/>

                section = (<section className= "loggedInSection">
                    {today}
                    {counter}
                    {list}
                </section>)

                bubbles = (<Bubbles/>);
            } else {
                section = (<section className="rendering">
                    <h3>Fetching data</h3>
                    <div className="loaderDiv">
                        <BeatLoader size="50" color="white"/>
                    </div>
                </section>)
            }
        } else {
            section = (<section>
                    <h3>Please log in</h3><br/>
                    <p>You need a solid pod to log in.</p>
                    <p>You can get one <a href="https://solid.inrupt.com/get-a-solid-pod">here.</a></p>
                </section>
            )
        }

        return (
            <section className={"App " + (this.state.isLoggedIn && this.state.hasFetched ? "appLoggedIn" : "appNotLoggedIn")}>
                <header>
                    <h1>Beer counter</h1>
                </header>
                <AuthButton
                className="authButtonApp"
                loggedIn={this.state.isLoggedIn}
                onClick={this.state.isLoggedIn ? this.handleLogOut : this.handleLogIn}
                />
                <section className="appSection">
                    {section}
                </section>
                <footer>
                    <span>
                      This application is powered by
                    </span>
                    <a href="https://solid.inrupt.com/">
                        <img alt="Solid inrupt" src={process.env.PUBLIC_URL + '/Knipsel.png'}/>
                    </a>
                </footer>
                {bubbles}
            </section>
        );
    }
}

export default App;
