const localStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateUser = (ssn, password, done) => {
        var reg = new RegExp("^[0-9]+$");
        if (!reg.test(ssn)) {
            return done(null, false, {
                message: "SSN can only contain numbers",
            });
        }
        pool.query(
            `SELECT * from employees WHERE pk_employee_ssn = $1`,
            [ssn],
            (err, results) => {
                if (err) {
                    throw err;
                }
                if (results.rows.length > 0) {
                    const user = results.rows[0];
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            throw err;
                        }

                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, {
                                message: "Password incorrect",
                            });
                        }
                    });
                } else {
                    return done(null, false, {
                        message: "SSN is not registed",
                    });
                }
            }
        );
    };

    passport.use(
        new localStrategy(
            { usernameField: "ssn", passwordField: "password" },
            authenticateUser
        )
    ),
        passport.serializeUser((user, done) =>
            done(null, user.pk_employee_ssn)
        );
    passport.deserializeUser((ssn, done) => {
        pool.query(
            `SELECT * FROM employees WHERE pk_employee_ssn = $1`,
            [ssn],
            (err, results) => {
                if (err) {
                    throw err;
                }

                return done(null, results.rows[0]);
            }
        );
    });
}

module.exports = initialize;
