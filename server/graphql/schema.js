const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id:ID!
        title:String!
        content:String!
        imageUrl:String!
        creator:User!
        createdAt:String!
        updatedAt:String!
    }
    type User {
        _id: ID!
        userName:String!
        firstName:String!
        lastName:String!
        email:String!
        password:String
        status: String!
        posts:[Post!]!
    }

    type AuthData{
        token:String!
        userId:String!
    }

    type PostData {
        posts:[Post!]!
        totalPosts:Int!
    }
    type StatusData {
        status:String!
    }
    input UserInputData{
       email:String!
       userName:String!
       firstName:String!
       lastName:String!
       password:String! 
    }
    input PostInputData{
      title:String!
      content:String!
      imageUrl:String! 
    }
    type RootQuery{
        login(email:String!, password: String!):AuthData!
        getStatus:StatusData!
        posts(page:Int):PostData!
        post(postId:ID):Post!

    }
    type RootMutation{
        createUser(userInput: UserInputData):User!
        createPost(postInput:PostInputData):Post!
        updatePost(postId:ID!, postInput:PostInputData):Post!
        updateStatus(status:String!):StatusData!
        deletePost(postId:ID!):Boolean!
    }
    schema{
        query: RootQuery
        mutation: RootMutation
    }
`);