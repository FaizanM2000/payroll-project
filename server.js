const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const { pool } = require("./dbConfig");
const passport = require("passport");

const initializePassport = require("./passportConfig");
initializePassport(passport);

const app = express();
const PORT = 4000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (_, res) => {
    res.render("index");
});

app.get("/users/register", checkAuthentication, (_req, res) => {
    res.render("register");
});

app.get("/users/login", checkAuthentication, (_req, res) => {
    res.render("login");
});

app.get("/users/dashboard", checkNoAuthentication, (_req, res) => {
    res.render("dashboard");
});

app.get("/users/logout", (req, res) => {
    req.logOut();
    req.flash("success_msg", "You have logged out.");
    res.redirect("/users/login");
});

app.post("/users/register", async (req, res) => {
    let { ssn, password, password2 } = req.body;
    let errors = [];

    if (!ssn || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password is too short" });
    }

    if (password != password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render("register", { errors });
    } else {
        let hashedPassword = await bcrypt.hash(password, 10);
        pool.query(
            `SELECT * from employees
            WHERE pk_employee_ssn = $1`,
            [ssn],
            (err, results) => {
                if (err) {
                    throw err;
                }
                //console.log(results.rows);
                if (results.rows.length > 0) {
                    errors.push({ message: "User already exists" });
                    res.render("register", { errors });
                } else {
                    pool.query(
                        `INSERT INTO employees (pk_employee_ssn, password)
                        VALUES ($1, $2)
                        RETURNING pk_employee_ssn, password`,
                        [ssn, hashedPassword],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash(
                                "success_msg",
                                "You are now registered, please log in."
                            );
                            res.redirect("/users/login");
                        }
                    );
                }
            }
        );
    }
});

app.post(
    "/users/login",
    passport.authenticate("local", {
        successRedirect: "/users/dashboard",
        failureRedirect: "/users/login",
        failureFlash: true,
    })
);

function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/users/dashboard");
    }
    next();
}

function checkNoAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/users/login");
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
