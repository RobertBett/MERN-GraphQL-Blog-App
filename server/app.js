require('dotenv').config();
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
const isAuth = require('./middleware/isAuth');

const app = express();
app.use(isAuth);
app.use((req, res, next) =>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST, PUT,PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

// Image Upload Code 
const fileStorage = multer.diskStorage({
    destination:(req, file, cb) =>{
        cb(null, 'images');
    },
    filename: ( req, file, cb )=>{
        cb(null, new Date().toISOString() + '_' + file.originalname.replace(/\s/g, ''));
    }
});

const fileFilter = (req, file, cb) =>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cd(null, false);
    }
};
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.put('/post-image',(req,res, next)=>{
    console.log(req.file);
    if(!req.isAuth){
        throw new Error('Not Authenticated!');
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided'});
    };
    if(req.body.oldPath){
        clearImage(req.body.oldPath);
    }
    return res.status(201).json({ message:'File Stored', filePath: req.file.path});
});
/// ends here

app.use(bodyParser.json()); //Used to parse incoming Json Data


app.use((error, req, res, next) =>{
    console.error(error);
    const { statusCode, message, data  } = error;
    res.status(statusCode || 500).json({ message, data });
});



app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql:true,
    customFormatErrorFn(err){
        if(!err.originalError){
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An Error';
        const status = err.originalError.code || 500;
        return { message, status, data};
    }
}))

const port = 8080;
const uri = process.env.MONGO_URL;

mongoose.connect(uri, { useFindAndModify: false })
.then(() => {
    app.listen(port, () => {
        console.log(chalk.green.bold(`On Port:${port}`))
        console.log(chalk.green.bold.underline(`Running on http://localhost:${port}`))
    }); 

}).catch((err) => {
    console.error(err);
});
