import React from 'react';
import './App.scss';
import Counter from './components/Counter';
import List from './components/List';
import Today from './components/Today';
import LogOutButton from './components/LogOutButton'
import LogInButton from './components/LogInButton'

import SolidCommunicator from './netwerk/SolidCommunicator';
import BeerCounter from './model/BeerCounter'

const fileClient = require('solid-file-client');
const authClient = require('solid-auth-client');

class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      isLoggedIn : false,
      error: undefined
    }
  }

  componentDidMount(){
    this.checkForLogin();
  }

  checkForLogin = () => {
    if(this.state.beerCounter){
      this.state.beerCounter.unsubscribe();
    }

    fileClient.checkSession().then( session => {
      let beerCounter = new BeerCounter();
      beerCounter.subscribe(this);

      if(session){
        this.setState({
          isLoggedIn : true,
          beerCounter : beerCounter
        });
  
        SolidCommunicator.build(beerCounter).then( aa => {
          this.setState({
            hasFetched: true,
            amountOfBeersToday : this.state.beerCounter.getBeerCount(),
            dateToday : this.state.beerCounter.getDateToday()
          });
        }).catch(err => {
          console.log(err);
          this.setState({
            error : true
          })
        });
      }else{
        this.setState({
          isLoggedIn : false
        });
      }
    }, err =>  this.setState({
      isLoggedIn : false
    }));
  }

  update = () =>{

    this.setState({
      amountOfBeersToday : this.state.beerCounter.getBeerCount(),
      dateToday : this.state.beerCounter.getDateToday()
    });

  }

  handleLogIn = () => {
    let popupUri = './popup.html';
    authClient.popupLogin({ popupUri }).then(() => {
      this.checkForLogin();
    })
  }

  handleLogOut = () => {
    fileClient.logout()
    .then(
      this.setState({isLoggedIn : false})
      );
  }

  increaseBeers = () => {
    this.state.beerCounter.increaeCountToday();
  }
  
  render(){
    let button;
    let appData;
    let rendering;
    let error;

    if(this.state.isLoggedIn){
      button = <LogOutButton onClick = {this.handleLogOut}></LogOutButton>

      if(this.state.error){
        error = <p className = "error">
          Something went wrong: Try refreshing the page or the application does not have correct access, Please fix this by giving this application Read, Write and Append access 
          in your pod
        </p>
      }else if(this.state.hasFetched){
        let list = <List beerCounter = {this.state.beerCounter}></List>
        let counter = <Counter onClick = {this.increaseBeers}></Counter>
        let today = <Today date = {this.state.dateToday} beers = {this.state.amountOfBeersToday}></Today>
      
        appData = (<section>
            {today}
            {counter}
            {list}
        </section>)
      }else{
        rendering = (<section id = "rendering">
          <h3>Fetching data</h3>
          <div id = "fetchinAnimation"></div>
        </section>)
      }
    }else{
      button = <LogInButton onClick = {this.handleLogIn}></LogInButton>
      rendering = (<section id = "rendering">
                      <h3>Please log in</h3><br/>
                      <p>You need a solid pod to log in</p>
                      <p>You can get one <a href ="https://solid.inrupt.com/get-a-solid-pod">here</a></p>
                  </section>
                  )
    }

    return (
      <div>
        <header>
          <h1>Beer counter</h1>
        </header>
        <section id = "authDiv">
          {button}
        </section>
          {rendering}
          {appData}
          {error}
          <footer>
            <span>
              This application is powered by
            </span>
              <a href="https://solid.inrupt.com/">
                <img alt = "Solid inrupt" src={process.env.PUBLIC_URL + '/Knipsel.png'} /> 
              </a>
          </footer>
      </div>
    );
  }
}



export default App;
