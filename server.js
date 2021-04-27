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

app.get("/users/dashboard", checkNoAuthentication, (req, res) => {
    if (req.user.jobtitle == "employee") {
        `SELECT * from employees
            WHERE pk_employee_ssn = $1`,
            [req.pk_employee_ssn],
            (err, result) => {
                if (err) {
                    throw err;
                }
                employees = result.rows;
                res.render("dashboard", {
                    employees,
                });
            };
    } else {
        pool.query(`SELECT * from employees`, (err, result) => {
            if (err) {
                throw err;
            }
            var employees = result.rows;
            pool.query(`SELECT * from dependent`, (err, result) => {
                if (err) {
                    throw err;
                }
                var dependent = result.rows;
                pool.query(`SELECT * from bonus`, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    var bonus = result.rows;
                    pool.query(`SELECT * from benefits`, (err, result) => {
                        if (err) {
                            throw err;
                        }
                        var benefits = result.rows;
                        pool.query(`SELECT * from insurance`, (err, result) => {
                            if (err) {
                                throw err;
                            }
                            var insurance = result.rows;
                            pool.query(`SELECT * from tax`, (err, result) => {
                                if (err) {
                                    throw err;
                                }
                                var tax = result.rows;
                                res.render("dashboard", {
                                    employees,
                                    dependent,
                                    tax,
                                    bonus,
                                    benefits,
                                    insurance,
                                });
                            });
                        });
                    });
                });
            });
        });
    }
});

app.get("/users/logout", (req, res) => {
    req.logOut();
    req.flash("success_msg", "You have logged out.");
    res.redirect("/users/login");
});

// TODO: THIS
app.post("/users/update", async (req, res) => {});

app.post("/users/register", async (req, res) => {
    let { table } = req.body;
    var reg = new RegExp("^[0-9]+$");
    if (table == "employeesCustom") {
        let { ssn, password, password2 } = req.body;
        let errors = [];

        if (!ssn || !password || !password2) {
            errors.push({ message: "Please enter all fields" });
        }

        if (!reg.test(ssn)) {
            errors.push({ message: "SSN can only contain numbers" });
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
    } else if (table == "employees") {
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            let password = "password";
            let hashedPassword = await bcrypt.hash(password, 10);
            pool.query(
                `SELECT * from employees
            WHERE pk_employee_ssn = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    //console.log(results.rows);
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Employee already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO employees (pk_employee_ssn, password)
                        VALUES ($1, $2)
                        RETURNING pk_employee_ssn, password`,
                            [primary_key, hashedPassword],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Employee successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
    } else if (table == "dependent") {
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            pool.query(
                `SELECT * from dependent
            WHERE pk_dependent_ssn = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Dependent already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO dependent (pk_dependent_ssn, fk_employee_ssn)
                        VALUES ($1, $2)
                        RETURNING pk_dependent_ssn, fk_employee_ssn`,
                            [primary_key, req.user.pk_employee_ssn],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Dependent successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
    } else if (table == "tax") {
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            pool.query(
                `SELECT * from tax
            WHERE pk_tax_id = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Tax already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO tax (pk_tax_id, stateRate, federalRate)
                        VALUES ($1, 0, 0)
                        RETURNING pk_tax_id`,
                            [primary_key],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Tax successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
    } else if (table == "bonus") {
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            pool.query(
                `SELECT * from bonus
            WHERE pk_bonus_id = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Bonus already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO bonus (pk_bonus_id, allocatedPercentage)
                        VALUES ($1, 0)
                        RETURNING pk_bonus_id`,
                            [primary_key],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Bonus successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
    } else if (table == "benefits") {
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            pool.query(
                `SELECT * from benefits
            WHERE pk_benefits_id = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Benefits already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO benefits (pk_benefits_id, healthPlan, contributionPlan, attorneyPlan, lifeInsurance)
                        VALUES ($1, 0, 0, 0, 0)
                        RETURNING pk_benefits_id`,
                            [primary_key],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Benefits successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
    } else {
        //table == "insurance"
        let { primary_key } = req.body;
        let errors = 0;
        if (!primary_key) {
            req.flash("success_msg", "Please enter all fields");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (!reg.test(primary_key)) {
            req.flash("success_msg", "Primary Key can only contain numbers");
            res.redirect("/users/dashboard");
            errors++;
        }

        if (errors == 0) {
            pool.query(
                `SELECT * from insurance
            WHERE pk_insurance_id = $1`,
                [primary_key],
                (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if (results.rows.length > 0) {
                        req.flash("success_msg", "Insurance already exists");
                        res.redirect("/users/dashboard");
                    } else {
                        pool.query(
                            `INSERT INTO insurance (pk_insurance_id, individualCost, familyCost, employeePaidPremium, employerPaidPremium)
                        VALUES ($1, 0, 0, 0, 0)
                        RETURNING pk_insurance_id`,
                            [primary_key],
                            (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                req.flash(
                                    "success_msg",
                                    "Insurance successfully created."
                                );
                                res.redirect("/users/dashboard");
                            }
                        );
                    }
                }
            );
        }
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
