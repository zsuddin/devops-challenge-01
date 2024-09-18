const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const CreateRelease = require('./models/CreateRelease');
const ListReleases = require('./models/ListReleases');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Route to create a new release
const createReleaseRoute = (db) => (req, res) => {
    let createRelease;

    try {
        createRelease = new CreateRelease(req.body);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const query = 'INSERT INTO releases (name, version, account, region) VALUES (?, ?, ?, ?)';
    db.query(query, [createRelease.name, createRelease.version, createRelease.account, createRelease.region], (err, result) => {
        if (err) {
            console.error('Error inserting release:', err);
            return res.status(500).json({ error: 'Failed to create release.' });
        }
        res.status(201).json({ message: 'Release created successfully.', releaseId: result.insertId });
    });
};

// Route to get all releases with pagination
const listReleasesRoute = (db) => (req, res) => {
    let listReleases;

    try {
        listReleases = new ListReleases(req.query);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const query = 'SELECT * FROM releases ORDER BY created_at DESC LIMIT ? OFFSET ?';
    db.query(query, [listReleases.limit, listReleases.offset], (err, results) => {
        if (err) {
            console.error('Error fetching releases:', err);
            return res.status(500).json({ error: 'Failed to fetch releases.' });
        }
        res.status(200).json(results);
    });
};

const detectDriftRoute = (db) => (req, res) => {
    // application one 3.0.1 is in all environments except prod 5
    // application three 3.2.1 is missing in all secondary regions on prod
    //  application four 4.4.4 is missing in prod_four primary
    // application eight 3.6.9 is only in staging and prod_five
    //  application ten 5.0.0 is only in staging
    results = [
        { 
            application_one: {
                latest : "3.0.1",
                drift: {
                    prod_five : { primary: "2.9.9", secondary: "2.9.9" }
                }
            }
        },
        {
            application_three: {
                latest: "3.2.1",
                drift: {
                    prod_one: { secondary: "3.0.2" },
                    prod_two: { secondary: "3.0.2" },
                    prod_three: { secondary: "3.0.2" },
                    prod_four: { secondary: "3.0.2" },
                    prod_five: { secondary: "3.0.2" }
                }
            }
        },
        {
            application_four: {
                latest: "4.4.4",
                drift: {
                    prod_four: { primary: "4.4.3" }
                }
            }
        },
        {
            application_eight: {
                latest: "3.6.9",
                drift: {
                    prod_one: { primary: "2.9.9", secondary: "2.9.9" },
                    prod_two: { primary: "2.9.9", secondary: "2.9.9"  },
                    prod_three: { primary: "2.9.9", secondary: "2.9.9"  },
                    prod_four: { primary: "2.9.9", secondary: "2.9.9" },
                }
            }
        },
        {
            application_ten: {
                latest: "5.0.0",
                drift: {
                    prod_one: { primary: "2.9.9", secondary: "2.9.9" },
                    prod_two: { primary: "2.9.9", secondary: "2.9.9"  },
                    prod_three: { primary: "2.9.9", secondary: "2.9.9"  },
                    prod_four: { primary: "2.9.9", secondary: "2.9.9" },
                    prod_five: { primary: "2.9.9", secondary: "2.9.9" }
                }
            }
        }
    ]
    res.status(200).json(results);
};

// Inject dependencies into routes
app.post('/release', createReleaseRoute(db));
app.get('/releases', listReleasesRoute(db));
app.get('/drift', detectDriftRoute(db));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});