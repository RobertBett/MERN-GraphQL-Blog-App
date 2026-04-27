const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const { deleteFile } = require('../utils/deleteFile');

module.exports = {
   createUser: async ({ userInput}, req) =>{
        const { _id, email,userName,firstName,lastName, password, status, posts} = userInput;
        const errors = [];
        if(!validator.isEmail(email)){
            errors.push({ message: 'Email is Invalid'});
        }
        if(validator.isEmpty(password) || !validator.isLength(password, { min: 5})){
            errors.push({ message:'Password is too Short!'});
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            throw error;
        }
        const existingUser = await User.findOne({ email});
        if(existingUser){
            const error = new Error('User already exists try signing in');
            throw error;
        }
        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email,
            userName,
            firstName,
            lastName,
            password: hashedPassword,
        });
        const createdUser = await user.save();
        return {...createdUser._doc, _id: createdUser._id.toString()};
   },
   login: async ({ email, password }) =>{
        const user = await User.findOne({ email});
        if(!user){
            const error = new Error('User not found');
            error.code = 401;
            throw error;
        };
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual){
            const error = new Error('Password is incorrect');
            error.code = 401;
            throw error;
        };
        const token = jwt.sign({
            email: user.email,
            userId: user._id.toString()
        },'somthingsecretbutawesome',{ expiresIn:'1h'}
        );
        return { token, userId: user._id.toString()};

   },
   createPost: async ({ postInput}, req) => {
       if(!req.isAuth){
           const error = new Error('Not Authenticated')
           error.code = 401;
           throw error;
       };
       const errors = [];
       const { title, content, imageUrl } = postInput;
       if(validator.isEmpty(title)|| !validator.isLength(title, { min:5})){
            errors.push({ message:'Title is invalid'})
        };
       if(validator.isEmpty(content)|| !validator.isLength(content, { min:5})){
        errors.push({ message:'Content is invalid'})
        };
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            error.code = 422;
            throw error;
        };
        const user = await User.findById(req.userId);
        if(!user){
            const error = new Error('Not Authenticated');
            error.data = errors;
            error.code = 401;
            throw error;
        }
        const post = new Post({
            title,
            content,
            imageUrl,
            creator: user
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return{
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
   },
   posts: async ({ page }, req) =>{
        // if(!req.isAuth){
        //     const error = new Error('Not Authenticated');
        //     error.code = 401;
        //     throw error;
        // };
        if(!page){
            page = 1;
        };
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1})
            .skip((page -1) * perPage)
            .limit(perPage)
            .populate('creator');
            return{ posts:posts.map((post) => {
                return{
                    ...post._doc,
                    _id: post._id.toString(), 
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: post.updatedAt.toISOString()
                };
            }), totalPosts};
   },
   post: async ({ postId }, req) =>{
        if(!req.isAuth){
            const error = new Error('Not Authenticated');
            error.code = 401;
            throw error;
        };
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        };
        
        return { 
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        };
   },
   updatePost: async ({ postId, postInput }, req) =>{
        const errors = [];
        const { title, content, imageUrl } = postInput;

        if(!req.isAuth){
            const error = new Error('Not Authenticated');
            error.code = 401;
            throw error;
        };

        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        };

        if(post.creator._id.toString() !== req.userId.toString()){
            const error = new Error('Not Authorized!');
            error.code = 403;
            throw error;
        };

        if(validator.isEmpty(title)|| !validator.isLength(title, { min:5})){
                errors.push({ message:'Title is invalid'})
            };
        if(validator.isEmpty(content)|| !validator.isLength(content, { min:5})){
            errors.push({ message:'Content is invalid'})
            };
            if (errors.length > 0) {
                const error = new Error('Invalid input');
                error.data = errors;
                error.code = 422;
                throw error;
            };
            post.title = title;
            post.content = content;
            if(imageUrl !== 'undefined'){
                await deleteFile(post.imageUrl)
                post.imageUrl = imageUrl
            };

            const updatedPost = await post.save();
            return{
                ...updatedPost._doc,
                _id: updatedPost._id.toString(),
                createdAt: updatedPost.createdAt.toISOString(),
                updatedAt: updatedPost.updatedAt.toISOString()
            };

   },
   deletePost: async ({ postId }, req ) =>{
        const post = await Post.findById(postId);
        const user = await User.findById(req.userId);
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        };
        if(post.creator.toString() !== req.userId.toString()){
            const error = new Error('Not Authorized!');
            error.statusCode = 403;
            throw error;
        };
        await Post.deleteOne({ _id: postId});
        await deleteFile(post.imageUrl);
        await user.posts.pull(postId);
        await user.save();
        return true;
   },
   updateStatus: async ({ status }, req) =>{
       const user = await User.findById(req.userId);
       if(!user){
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = status;
        const updatedUser = await user.save();
        return{
            status: updatedUser.status
        }
   },
   getStatus: async(res,req) =>{
       const user = await User.findById(req.userId);
       if(!user){
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        return{
            status: user.status
        }
   }
};