import React, { Component, Fragment } from 'react';
import axios from 'axios';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openModal: false,
      posts: [],
      totalPosts: 0,
      editPost: null,
      status: '',
      postPage: 1,
      postsLoading: true,
      editLoading: false,
      isEditing: false,
    };
  }

  componentDidMount() {
    // axios({
    //   method:'post',
    //   url:`http://localhost:8080/graphql`,
    //   data:{
    //     query:`
    //     {
    //       getStatus{ status }
    //     }
    //     `
    //   },
    //   headers:{
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.props.token}`
    //    }
    // })
    //   .then(({ data }) => {
    //     console.log(data.data, 'THIS IS THE UPDATED STATUS')
    //     this.setState({ status: data.data.getStatus.status });
    //   })
    //   .catch( err =>{
    //     console.error(err,'IS THIS A PROBLEM');
    //     // this.catchError(err)
    //   });

    this.loadPosts();
  }

  loadPosts = (direction) => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page += 1;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page -= 1;
      this.setState({ postPage: page });
    }

    const graphqlQuery = {
      query: `
      query FetchPosts($page:Int){
        posts(page:$page) {
          posts{
            _id
            title
            content
            imageUrl
            creator{
              userName
            }
            createdAt
          }
          totalPosts
        }
      }
      `,
      variables: {
        page,
      },
    };
    axios({
      method: 'post',
      url: 'http://localhost:8080/graphql',
      data: { ...graphqlQuery },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.props.token}`,
      },
    })
      .then(({ data }) => {
        this.setState({
          posts: data.data.posts.posts,
          totalPosts: data.data.posts.totalPosts,
          postsLoading: false,
        });
      })
      .catch((err) => {
        this.catchError(err);
      });
  };

  statusUpdateHandler = (event) => {
    event.preventDefault();
    const { status } = this.state;
    const graphqlQuery = {
      query: `
      mutation UpdateUserStatus($status: String!){
        updateStatus( status:$status){ 
          status
        }
      }
      `,
      variables: {
        status,
      },
    };
    axios({
      method: 'post',
      url: 'http://localhost:8080/graphql',
      data: { ...graphqlQuery },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.props.token}`,
      },
    })
      .then((resData) => {
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ openModal: true });
  };

  startEditPostHandler = (postId) => {
    this.setState((prevState) => {
      const loadedPost = { ...prevState.posts.find((p) => p._id === postId) };
      return {
        openModal: true,
        isEditing: true,
        editPost: loadedPost,
        postId,
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ openModal: false, editPost: null, isEditing: false });
  };

  finishEditHandler = (postData) => {
    const { title, content, image } = postData;
    const { editPost, isEditing } = this.state;
    this.setState({
      editLoading: true,
    });

    // Set up data (with image!)
    console.log(image);
    const formData = new FormData();
    formData.append('image', image);
    if (editPost) {
      formData.append('oldPath', editPost.imagePath);
    }

    axios({
      method: 'put',
      url: 'http://localhost:8080/post-image',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${this.props.token}`,
      },
    }).then(({ data }) => {
      const imageUrl = data.filePath || 'undefined';
      const graphqlQuery = !isEditing ? {
        query: `
              mutation{
                createPost(postInput:{
                  title:"${title}",
                  content:"${content}",
                  imageUrl:"${imageUrl}"
              
                })
                {_id 
                  title 
                  content 
                  imageUrl
                  creator{
                    userName
                  } 
                  createdAt 
                  updatedAt  
                }
              }
            `,
      }
        : {
          query: `
              mutation{
                updatePost(postId:"${editPost._id}",postInput:{
                  title:"${title}",
                  content:"${content}",
                  imageUrl:"${imageUrl}"
              
                })
                {_id 
                  title 
                  content 
                  imageUrl
                  creator{
                    userName
                  } 
                  createdAt 
                  updatedAt  
                }
              }
            `,
        };
      return axios({
        method: 'post',
        url: 'http://localhost:8080/graphql',
        data: { ...graphqlQuery },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.props.token}`,
        },
      });
    })
      .then(({ data }) => {
        const resDataField = editPost ? 'updatePost' : 'createPost';
        const {
          // eslint-disable-next-line no-shadow
          _id, title, content, imageUrl, creator, createdAt,
        } = data.data[resDataField];
        const post = {
          _id,
          title,
          content,
          imageUrl,
          creator,
          createdAt,
        };
        this.setState((prevState) => {
          const updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              (p) => p._id === prevState.editPost._id,
            );
            updatedPosts[postIndex] = post;
          } else {
            if (prevState.posts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post);
          }
          return {
            posts: updatedPosts,
            openModal: false,
            isEditing: false,
            editPost: null,
            editLoading: false,
          };
        });
      })
      .catch((err) => {
        this.catchError(err);
        this.setState({
          openModal: false,
          editPost: null,
          editLoading: false,
          isEditing: false,
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = (postId) => {
    this.setState({ postsLoading: true });
    axios({
      method: 'post',
      url: 'http://localhost:8080/graphql',
      data: {
        query: `
          mutation{
            deletePost(postId:"${postId}")
          }
        `,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.props.token}`,
      },
    })
      .then(() => {
        this.setState((prevState) => {
          const updatedPosts = prevState.posts.filter((p) => p._id !== postId);
          return { posts: updatedPosts, postsLoading: false };
        });
      })
      .catch((err) => {
        this.catchError(err);
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = (error) => {
    this.setState({ error });
  };

  render() {
    console.log(this.props, ['WHAT IS IN FEED PROPS']);
    return (
      <>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.openModal}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.userName}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </>
    );
  }
}

export default Feed;
