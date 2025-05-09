const express = require('express');
// const { register } = require('../models/review');
const wrapAsync = require('../utils/wrapAsync');
const router = express.Router();
const User = require("../models/user.js");
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware.js');

router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
})

router.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        // Ensure req.body.user exists before destructuring
        if (!req.body.user) {
            req.flash("error", "Invalid form submission");
            return res.redirect("/signup");
        }

        let { name, email,username, phone, role, password } = req.body.user;

        // Check if username exists
        if (!username) {
            req.flash("error", "Username is required!");
            return res.redirect("/signup");
        }

        // Check if password exists
        if (!password) {
            req.flash("error", "Password is required!");
            return res.redirect("/signup");
        }

        // Create a new user instance (excluding password)
        const newUser = new User({
            name,
            email,
            username,
            phone,
            role
        });

        // Register user with Passport.js (password is stored separately)
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);

        // Log in the user after successful registration
        req.logIn(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to TripNiti!");
            res.redirect("/")
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));


router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

router.post('/login',saveRedirectUrl, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'You are now logged in');
            return res.redirect("/")
        });
    })(req, res, next);
});

router.get("/logout",(req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are logged out !!");
        res.redirect("/");
    })
})

module.exports = router;