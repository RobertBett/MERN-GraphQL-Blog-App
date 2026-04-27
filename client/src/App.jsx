import axios from 'axios';
import React, { Component, Fragment } from 'react';
import {
  Route, Switch, Redirect, withRouter,
} from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showBackdrop: false,
      showMobileNav: false,
      isAuth: true,
      token: null,
      userId: null,
      authLoading: false,
      error: null,
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    const expiryDate = localStorage.getItem('expiryDate');
    // if (!token || !expiryDate) {
    //   return;
    // }
    // if (new Date(expiryDate) <= new Date()) {
    //   this.logoutHandler();
    //   return;
    // }
    const userId = localStorage.getItem('userId');
    this.setState({ isAuth: true, token, userId });

    const remainingMilliseconds = new Date(expiryDate).getTime() - new Date().getTime();
    console.log(userId, token, 'IS THE BUG COMING FROM HERE??');
    console.log(remainingMilliseconds, ['WHAT IS IN THIS TING?']);
    // this.setAutoLogout(remainingMilliseconds);
  }

  mobileNavHandler = (isOpen) => {
    this.setState({ showMobileNav: isOpen, showBackdrop: isOpen });
  };

  backdropClickHandler = () => {
    this.setState({ showBackdrop: false, showMobileNav: false, error: null });
  };

  logoutHandler = () => {
    this.setState({ isAuth: false, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('expiryDate');
    localStorage.removeItem('userId');
  };

  loginHandler = (event, authData) => {
    event.preventDefault();
    const { email, password } = authData;
    this.setState({ authLoading: true });
    const graphqlQuery = {
      query: `
        {
          login(email:"${email}",password:"${password}")
          {token userId}
        }
      `,
    };
    axios({
      method: 'post',
      url: 'http://localhost:8080/graphql',
      data: { ...graphqlQuery },
    })
      .then(({ data }) => {
        console.log(data, '[WHATS IN HERE]');
        const { token, userId } = data.data.login;
        this.setState({
          isAuth: true,
          token,
          authLoading: false,
          userId,
        });
        this.props.history.push('/feed');
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);

      // const remainingMilliseconds = 60 * 60 * 1000;
      // const expiryDate = new Date(
      //   new Date().getTime() + remainingMilliseconds
      // );
      // localStorage.setItem('expiryDate', expiryDate.toISOString());
      // this.setAutoLogout(remainingMilliseconds);
      })
      .catch((err) => {
        if (err.status === 422) {
          throw new Error('Validation failed.');
        }
        console.log('IS THIS WHAT IS FAILING??');
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err,
        });
      });
  };

  signupHandler = (event, authData) => {
    event.preventDefault();
    this.setState({ authLoading: true });
    const {
      email, password, firstName, lastName, userName, confirmPassword,
    } = authData.signupForm;
    console.log(confirmPassword);
    const graphqlQuery = {
      query: `
          mutation {
            createUser(userInput:{
              email:"${email.value}",
              userName:"${userName.value}", 
              firstName:"${firstName.value}",
              lastName:"${lastName.value}",
              password:"${password.value}"
            })
            {_id email}
          }
        `,
    };
    axios({
      method: 'post',
      url: 'http://localhost:8080/graphql',
      data: { ...graphqlQuery },
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(() => {
        this.setState({ isAuth: false, authLoading: false });
        this.props.history.push('/');
      })
      .catch((err) => {
        console.log(err, 'IS HTHIDS FR');
        if (err.status === 422) {
          throw new Error(
            'Validation failed. Make sure the email address isn\'t used yet!',
          );
        }

        this.setState({
          isAuth: false,
          authLoading: false,
          error: err,
        });
      });
  };

  // setAutoLogout = milliseconds => {
  //   setTimeout(() => {
  //     this.logoutHandler();
  //   }, milliseconds);
  // };

  errorHandler = () => {
    this.setState({ error: null });
  };

  renderRoutes = () => {
    const routes = this.state.isAuth ? [
      {
        path: '/feed',
        component: (props) => (
          <FeedPage
            {...props}
            userId={this.state.userId}
            token={this.state.token}
          />
        ),
      },
      {
        path: '/:postId',
        component: (props) => (
          <SinglePostPage
            {...props}
            userId={this.state.userId}
            token={this.state.token}
          />
        ),
      },
      {
        path: '*',
        component: (props) => (
          <Redirect
            {...props}
            to="/feed"
            userId={this.state.userId}
            token={this.state.token}
          />
        ),
      },
    ]
      : [
        {
          path: '/login',
          component: (props) => (
            <LoginPage
              {...props}
              onLogin={this.loginHandler}
              loading={this.state.authLoading}
            />
          ),
        },
        {
          path: '/signup',
          component: (props) => (
            <SignupPage
              {...props}
              onSignup={this.signupHandler}
              loading={this.state.authLoading}
            />
          ),
        },
        {
          path: '*',
          component: (props) => (
            <Redirect
              {...props}
              to="/login"
              userId={this.state.userId}
              token={this.state.token}
            />
          ),
        },
      ];
    return (
      <Switch>
        {
          routes.map((route, i) => (
            <Route
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              path={route.path}
              render={route.component}
            />
          ))
        }
      </Switch>
    );
  }

  render() {
    // const { isAuth } = this.state;
    // const { pathname } = this.props;
    // isAuth ?
    //   routes = (
    //     <Switch>

    //       <Route
    //         path="/feed"
    //         render={({match}) => {
    //           return <FeedPage userId={this.state.userId} token={this.state.token} />
    //         }}
    //       />
    //       <Route
    //         path="/:postId"
    //         render={props => {
    //           const { match } = props;
    //           console.log(match,['THIS IS A TEST'])
    //           return <SinglePostPage
    //             {...props}
    //             userId={this.state.userId}
    //             token={this.state.token}
    //           />
    //         }}
    //       />
    //     <Route
    //       path="*"
    //       render={() => <Redirect to="/feed" />}
    //     />
    //     </Switch>
    //   )
    //   :
    //   routes = (
    //     <Switch>
    //       <Route
    //         path="/login"
    //         exact
    //         render={props => (
    //           <LoginPage
    //             {...props}
    //             onLogin={this.loginHandler}
    //             loading={this.state.authLoading}
    //           />
    //         )}
    //       />
    //       <Route
    //         path="/signup"
    //         exact
    //         render={props => (
    //           <SignupPage
    //             {...props}
    //             onSignup={this.signupHandler}
    //             loading={this.state.authLoading}
    //           />
    //         )}
    //       />

    //     </Switch>
    //   )
    return (
      <>
        {this.renderRoutes()}
        {console.log(this.state.isAuth)}
        {this.state.showBackdrop && (
          <Backdrop onClick={this.backdropClickHandler} />
        )}
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <Layout
          header={(
            <Toolbar>
              <MainNavigation
                onOpenMobileNav={this.mobileNavHandler}
                onLogout={this.logoutHandler}
                isAuth={this.state.isAuth}
              />
            </Toolbar>
          )}
          mobileNav={(
            <MobileNavigation
              open={this.state.showMobileNav}
              mobile
              onChooseItem={this.mobileNavHandler}
              onLogout={this.logoutHandler}
              isAuth={this.state.isAuth}
            />
          )}
        />
      </>
    );
  }
}

export default withRouter(App);
