import React, { Fragment } from 'react';

import Backdrop from '../Backdrop/Backdrop';
import Modal from '../Modal/Modal';

const errorHandler = (props) => (
  <>
    {props.error && <Backdrop onClick={props.onHandle} />}
    {props.error && (
      <Modal
        title="An Error Occurred"
        onCancelModal={props.onHandle}
        onAcceptModal={props.onHandle}
        acceptEnabled
      >
        {
          console.log(props, 'WHATS IN PEROPS')
        }
        <p>
          {props.error.message}
          {' '}
          {props.error.response && props.error.response.data.message}
        </p>
        {
          props.error.data
          && props.error.data.map((errorField) => <p key={errorField.msg}>{errorField.msg}</p>)
        }
      </Modal>
    )}
  </>
);

export default errorHandler;
