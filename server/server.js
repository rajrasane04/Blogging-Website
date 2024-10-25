import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bycrypt from 'bcrypt';
import {nanoid} from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccountKey from './reactjs-blog-website-4f3c2-firebase-adminsdk-o3nwr-6e4413342d.json' with {type: "json"};
import {getAuth} from 'firebase-admin/auth' ;
import aws from "aws-sdk";


// schema below
import User from './Schema/User.js';

const server = express();
let PORT = 3000;

admin.initializeApp({
    credential : admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION,{
    autoIndex:true
})

// setting up S3 Bucket
const s3 = new aws.S3({
    region : 'ap-south-1',
    accessKeyId : process.env.AWS_ACCESS_KEY,
    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async () => {

    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket : 'reactjs-blogging-website-raj',
        Key : imageName ,
        Expires : 1000 ,
        ContentType : "image/jpeg"
    })
}

const verifyJWT = (req,res,next) => {
    
}

const formatDatatoSend = (user) => {
    const access_token = jwt.sign({ id : user._id}, process.env.SECRET_ACCESS_KEY)

    return{
        access_token ,
        profile_img : user.personal_info.profile_img,
        username : user.personal_info.username,
        fullname : user.personal_info.fullname
    }
}

const generateUsername = async(email) => {
    let username = email.split("@")[0];

    let usernameExists = await User.exists({"personal_info.username":username}).then((result)=>result)

    usernameExists ? username += nanoid().substring(0,5) : ""; 

    return username
}


// upload imageurl route

server.get('/get-upload-url', (req , res) => {
    generateUploadURL().then( url => res.status(200).json({ uploadURL : url }))
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error : err.message})
    })
})


server.post("/signup",(req,res)=>{

    let {fullname,email,password} = req.body;

    // Validating the frontend
    if(fullname.length < 3){
        return res.status(403).json({"error" : "fullname must be atleast 3 letters long"})
    }

    if(!email.length){
        return res.status(403).json({"error" : "enter email"})
    }

    if(!emailRegex.test(email)){
        return res.status(403).json({"error" : "Invalid Email"})
    }

    if(!passwordRegex.test(password)){
        return res.status(403).json({"error" : "Password should be 6 to 20 characters long with a numeric , 1 lowercase and 1 uppercase letters"})
    }


    bycrypt.hash(password,10,async (err,hashed_password)=>{

        let username = await generateUsername(email);

        let user = new User({
            personal_info : {fullname,email,password : hashed_password,username}
        })

        user.save().then((u)=>{

            return res.status(200).json(formatDatatoSend(u))
        })
        .catch(err=>{

            if(err.code == 11000){
                return res.status(500).json({"error" : "Email already exist"})
            }

            return res.status(500).json({"error":err.message})
        })
    })

})

server.post("/signin",(req,res)=>{


    let {email,password} = req.body;

    User.findOne({"personal_info.email" : email})
    .then((user)=>{
        if(!user){
            return res.status(403).json({"error" : "Email not found"});
        }
        
        if(!user.google_auth){

            bycrypt.compare(password,user.personal_info.password,(err,result)=>{

                if(err){
                    return res.status(403).json({"error" : "Error occured while login please try again"})
                }
    
                if(!result){
                    return res.status(403).json({"error" : "Incorrect password"})
                }
                else{
                    return res.status(200).json(formatDatatoSend(user))
                }
                
            })

        }
        else{
            res.status(403).json({"error" : "Account associated  this gmail was created using google . Try logging in with google."})
        }

    })
    .catch((err)=>{
        console.log(err)
        return res.status(500).json({"error" : err.message})
    })
})

server.post("/google-auth", async (req , res) => {

    let {access_token} = req.body;

    getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {

        let {email , name , picture} = decodedUser;

        picture = picture.replace("s96-c","s384-c");

        let user = await User.findOne({"personal_info.email" : email }).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch(err=>{
            
            return res.status(500).json({"error" : err.message})
        })

        if(user){ //login
            if(!user.google_auth){
                return res.status(403).json({"error" : "This email was signed up without Google. please log in with password to access the account. "})
            }

            return res.status(200).json(formatDatatoSend(user))
        }
        else{ //signup

            let username = await generateUsername(email);

            user = new User({
                personal_info : { fullname : name , email , username }, google_auth : true 
            }) 

            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({"error" : err.message})
            })

        }

        return res.status(200).json(formatDatatoSend(user))

    })
    .catch(err => {
        return res.status(500).json({"error" : "Failed to authentic with google. Try with some other google account"})
    })

})

server.post('/create-blog', verifyJWT,(req,res)=>{

    return res.json(req.body)
})

server.listen(PORT,()=>{
    console.log('listening on port -> ' + PORT);
})