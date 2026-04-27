/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import ReactDOM from 'react-dom';

import './Backdrop.css';

const backdrop = (props) => ReactDOM.createPortal(
  <div
    className={['backdrop', props.open ? 'open' : ''].join(' ')}
    onClick={props.onClick}
  />,
  document.getElementById('backdrop-root'),
);

export default backdrop;
