/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';

import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email } from '../../Utilities/validators';
import Auth from './Auth';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      signupForm: {
        email: {
          value: '',
          valid: false,
          touched: false,
          validators: [required, email],
        },
        password: {
          value: '',
          valid: false,
          touched: false,
          validators: [required, length({ min: 5 })],
        },
        confirmPassword: {
          value: '',
          valid: false,
          touched: false,
          validators: [required, length({ min: 5 })],
        },
        userName: {
          value: '',
          valid: false,
          touched: false,
          validators: [required],
        },
        firstName: {
          value: '',
          valid: false,
          touched: false,
          validators: [required],
        },
        lastName: {
          value: '',
          valid: false,
          touched: false,
          validators: [required],
        },
        formIsValid: false,
      },
    };
  }

  inputChangeHandler = (input, value) => {
    this.setState((prevState) => {
      let isValid = true;
      for (const validator of prevState.signupForm[input].validators) {
        isValid = isValid && validator(value);
      }
      const updatedForm = {
        ...prevState.signupForm,
        [input]: {
          ...prevState.signupForm[input],
          valid: isValid,
          value,
        },
      };
      let formIsValid = true;
      for (const inputName in updatedForm) {
        formIsValid = formIsValid && updatedForm[inputName].valid;
      }
      return {
        signupForm: updatedForm,
        formIsValid,
      };
    });
  };

  inputBlurHandler = (input) => {
    this.setState((prevState) => ({
      signupForm: {
        ...prevState.signupForm,
        [input]: {
          ...prevState.signupForm[input],
          touched: true,
        },
      },
    }));
  };

  render() {
    return (
      <Auth>
        <form onSubmit={(e) => this.props.onSignup(e, this.state)}>
          <Input
            id="email"
            label="Your E-Mail"
            type="email"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'email')}
            value={this.state.signupForm.email.value}
            valid={this.state.signupForm.email.valid}
            touched={this.state.signupForm.email.touched}
          />
          <Input
            id="userName"
            label="userName"
            type="text"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'userName')}
            value={this.state.signupForm.userName.value}
            valid={this.state.signupForm.userName.valid}
            touched={this.state.signupForm.userName.touched}
          />
          <Input
            id="firstName"
            label="FirstName"
            type="text"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'firstName')}
            value={this.state.signupForm.firstName.value}
            valid={this.state.signupForm.firstName.valid}
            touched={this.state.signupForm.firstName.touched}
          />
          <Input
            id="lastName"
            label="lastName"
            type="text"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'lastName')}
            value={this.state.signupForm.lastName.value}
            valid={this.state.signupForm.lastName.valid}
            touched={this.state.signupForm.lastName.touched}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'password')}
            value={this.state.signupForm.password.value}
            valid={this.state.signupForm.password.valid}
            touched={this.state.signupForm.password.touched}
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            control="input"
            onChange={this.inputChangeHandler}
            onBlur={this.inputBlurHandler.bind(this, 'confirmPassword')}
            value={this.state.signupForm.confirmPassword.value}
            valid={this.state.signupForm.confirmPassword.valid}
            touched={this.state.signupForm.confirmPassword.touched}
          />
          <Button design="raised" type="submit" loading={this.props.loading}>
            Signup
          </Button>
        </form>
      </Auth>
    );
  }
}

export default Signup;
