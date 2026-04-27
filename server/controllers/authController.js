const User = require('../models/User');
const { validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SEND_GRID_KEY,
    }
}));

exports.getUserStatus = (req, res, next) => {
    User.findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                status: user.status
            })
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.updateUserStatus = (req, res, next) => {
    const newStatus = req.body.status;
    console.log(newStatus);
    User.findById(req.userId)
        .then((user) => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            user.status = newStatus;
            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Successful Status Update' })
        })
        .catch((err) => {
            console.error(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    let loadedUser;

    if (!errors.isEmpty()) {
        const error = new Error('Validation Errors');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    };
    User.findOne({ email })
        .then((user) => {
            loadedUser = user;
            if (!user) {
                const error = new Error('An account with that email does not exist try signing up!');
                error.statusCode = 404;
                throw error;
            }
            bcrypt.compare(password, user.password)
                .then((match) => {
                    if (!match) {
                        const error = new Error('Wrong password');
                        error.statusCode = 404;
                        throw error;
                    };
                    const token = jwt.sign({
                        email: loadedUser.email,
                        userId: loadedUser._id.toString()
                    }, 'somthingsecretbutawesome', { expiresIn: '1h' });

                    res.status(200).json({
                        message: 'Successful Login!',
                        userData: {
                            token,
                            userId: loadedUser._id.toString()
                        }
                    });

                }).catch((err) => {
                    console.error(err);
                    if (!err.statusCode) {
                        err.statusCode = 500;
                    }
                    next(err);
                });

        }).catch((err) => {
            console.error(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.postSignup = (req, res, next) => {
    const { userName, email, password, firstName, lastName } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Errors');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    };

    bcrypt.hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                userName,
                firstName,
                lastName,
                email,
                password: hashedPassword,
            })
            return user.save();
        })
        .then((user) => {
            res.status(200).json({
                message: 'Successful Signup',
                user
            });
            return transporter.sendMail({
                to: email,
                from: 'robertbett6@gmail.com',
                subject: 'Successful Signup',
                html: `<h1> Hi ${userName} </h1>
                <h2>Welcome to Blog-App </h2>
                <h3>You have successfully signed up</h3>`
            })
        }).catch((err) => {
            console.error(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};