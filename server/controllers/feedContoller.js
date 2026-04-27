const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator/check');
const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/User');

exports.getPosts = async(req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments()
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        return res.status(200).json({
            message: 'Fetched Posts Successfully',
            posts,
            totalItems
        });
    } catch (error) {
        console.error(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = (req, res, next) => {
    const { postId } = req.params;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                post,
            })
        }).catch((err) => {
            console.error(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.editPost = (req, res, next) => {
    const errors = validationResult(req);
    const { postId } = req.params;
    const { title, content } = req.body;

    Post.findById(postId).populate('creator')
        .then((post) => {
            if (!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
            let imageUrl = req.file && req.file.path || post.imageUrl;

            if (post.creator._id.toString() !== req.userId) {
                const error = new Error('Not Authorized!');
                error.statusCode = 403;
                throw error;
            }
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    message: 'Validation failed, entered data is incorrect.',
                    errors: errors.array()
                });
            };

            if (!imageUrl) {
                const error = new Error('No image provided');
                error.statusCode = 422;
                throw error;
            };

            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            };

            post.title = title
            post.content = content
            post.imageUrl = imageUrl.replace(/\s/g, ''),
                post.creator = req.userId;

            return post.save()
        })
        .then((post) => {
            io.getIO().emit('posts', { action: 'create', post });
            res.status(201).json({ message: 'Post Updated Successfully' })
        })
        .catch((err) => {
            const { message, statusCode } = err
            console.error(err.message);
            if (!statusCode) {
                statusCode = 500;
            }
            res.status(statusCode).json({ message });
        });
};

exports.deletePost = (req, res, next) => {
    const { postId } = req.params;

    Post.findById(postId)
        .then((post) => {
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not Authorized!');
                error.statusCode = 403;
                throw error;
            }
            Post.deleteOne({ _id: postId })
                .then(() => {
                    clearImage(post.imageUrl);
                    return User.findById(req.userId);
                })
                .then((user) => {
                    user.posts.pull(postId);
                    return user.save();
                })
                .then(() => {
                    io.getIO().emit('posts', { action: 'delete', post: postId });
                    res.status(200).json({
                        message: 'Post Deleted Successfully'
                    })
                })
        }).catch((err) => {
            const { message, statusCode } = err;
            if (!err.statusCode) {
                err.statusCode = 500;
            };
            res.status(statusCode).json({ message });
        });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed, entered data is incorrect.',
            errors: errors.array()
        });
    };

    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    };

    const imageUrl = req.file.path
    const { title, content } = req.body;
    let creator;
    console.log(req.userId, 'EHATS IN THIS ID!!!');
    const post = new Post({
        title,
        content,
        imageUrl: imageUrl.replace(/\s/g, ''),
        creator: req.userId
    })
    post.save()
        .then(() => {
            return User.findById(req.userId);
        })
        .then((user) => {
            creator = user;
            user.posts.push(post);
            return user.save()
        })
        .then(() => {
            const { _id, userName } = creator;
            io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: { _id, userName } } });
            res.status(201).json({
                message: 'Post created Successfully!',
                post,
                creator: {
                    _id,
                    userName
                }
            });
        })
        .catch((err) => {
            console.error(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};