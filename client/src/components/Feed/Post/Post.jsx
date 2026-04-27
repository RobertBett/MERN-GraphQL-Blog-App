import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../Image/Image';
import './Post.css';

const post = (props) => (
  <article className="card">
    <header className="header">
      <Link className="title" to={props.id}>{props.title}</Link>
      <button type="button" className="cardButton editButton" onClick={props.onStartEdit}>
        <img className="editIcon" alt="editIcon" src="https://cdn0.iconfinder.com/data/icons/set-app-incredibles/24/Edit-01-512.png" />
      </button>
      <time className="username">
        Posted on
        {' '}
        {props.date}
      </time>
    </header>
    <Image imageUrl={`http://localhost:8080/${props.image}`} />
    <div className="status">
      <div className="like">
        <button type="button" className="cardButton likeButton" onClick="Like Functionality Here">
          <img className="likeIcon" alt="logoLike" src="https://cdn4.iconfinder.com/data/icons/app-custom-ui-1/48/Heart-128.png" />
        </button>
        <button type="button" className="cardButton commentButton" onClick="Like Functionality Here">
          <img className="commentIcon" alt="commentIcon" src="https://cdn4.iconfinder.com/data/icons/app-custom-ui-1/48/Chat_bubble-128.png" />
        </button>
        <button type="button" className="cardButton deleteButton" onClick={props.onDelete}>
          <img className="deleteIcon" alt="deleteIcon" src="https://cdn4.iconfinder.com/data/icons/linecon/512/delete-512.png" />
        </button>
      </div>
    </div>
    <div className="captionContent">
      <b>{props.author}</b>
      {' '}
      <p>{props.content}</p>
    </div>
    <div className="commentInput">
      <textarea placeholder="Add a comment…" />
      <img alt="commentOption" src="https://i.stack.imgur.com/twIm6.png" />
    </div>

  </article>
);

export default post;
