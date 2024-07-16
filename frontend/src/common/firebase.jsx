import { initializeApp } from "firebase/app";
import {GoogleAuthProvider , getAuth, signInWithPopup} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBd7ipy9oacjOdY55QayyplqFBXxJ89028",
  authDomain: "reactjs-blog-website-4f3c2.firebaseapp.com",
  projectId: "reactjs-blog-website-4f3c2",
  storageBucket: "reactjs-blog-website-4f3c2.appspot.com",
  messagingSenderId: "32475747738",
  appId: "1:32475747738:web:3b2a2537d85c00031e9623"
};

const app = initializeApp(firebaseConfig);

// google auth

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {

    let user = null;

    await signInWithPopup(auth , provider)
    .then((result)=>{
        user = result.user
    })
    .catch((err) => {
        console.log(err)
    })

    return user;
}