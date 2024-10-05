const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const CreateRelease = require('./models/CreateRelease');
const ListReleases = require('./models/ListReleases');
const { authenticateApiKey } = require('./middleware');


const app = express();
const port = 3000;

require('dotenv').config();

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
    // results = [
    //     { 
    //         application_one: {
    //             latest : "3.0.1",
    //             drift: {
    //                 prod_five : { primary: "2.9.9", secondary: "2.9.9" }
    //             }
    //         }
    //     },
    //     {
    //         application_three: {
    //             latest: "3.2.1",
    //             drift: {
    //                 prod_one: { secondary: "3.0.2" },
    //                 prod_two: { secondary: "3.0.2" },
    //                 prod_three: { secondary: "3.0.2" },
    //                 prod_four: { secondary: "3.0.2" },
    //                 prod_five: { secondary: "3.0.2" }
    //             }
    //         }
    //     },
    //     {
    //         application_four: {
    //             latest: "4.4.4",
    //             drift: {
    //                 prod_four: { primary: "4.4.3" }
    //             }
    //         }
    //     },
    //     {
    //         application_eight: {
    //             latest: "3.6.9",
    //             drift: {
    //                 prod_one: { primary: "2.9.9", secondary: "2.9.9" },
    //                 prod_two: { primary: "2.9.9", secondary: "2.9.9"  },
    //                 prod_three: { primary: "2.9.9", secondary: "2.9.9"  },
    //                 prod_four: { primary: "2.9.9", secondary: "2.9.9" },
    //             }
    //         }
    //     },
    //     {
    //         application_ten: {
    //             latest: "5.0.0",
    //             drift: {
    //                 prod_one: { primary: "2.9.9", secondary: "2.9.9" },
    //                 prod_two: { primary: "2.9.9", secondary: "2.9.9"  },
    //                 prod_three: { primary: "2.9.9", secondary: "2.9.9"  },
    //                 prod_four: { primary: "2.9.9", secondary: "2.9.9" },
    //                 prod_five: { primary: "2.9.9", secondary: "2.9.9" }
    //             }
    //         }
    //     }
    // ]
    const query = `SELECT 
            r1.name AS application_name,
            MAX(r1.version) AS latest_version,
            JSON_OBJECTAGG(
                r1.account, 
                JSON_OBJECT(
                    r1.region, 
                    r1.version
                )
            ) AS current_versions
        FROM releases r1
        JOIN (
            SELECT name, MAX(version) AS latest_version
            FROM releases
            GROUP BY name
        ) r2 ON r1.name = r2.name AND r1.version < r2.latest_version
        GROUP BY r1.name;`;

        db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching releases:', err);
            return res.status(500).json({ error: 'Failed to fetch releases.' });
        }

        const transformedData = [];

        const wordToNumber = (word) => {
            const numWords = {
                one: 1,
                two: 2,
                three: 3,
                four: 4,
                five: 5,
                six: 6,
                seven: 7,
                eight: 8,
                nine: 9,
                ten: 10,
            };
            return numWords[word.toLowerCase()] || 0; 
        };

        results.sort((a, b) => {
            const numA = wordToNumber(a.application_name.split('_')[1]);
            const numB = wordToNumber(b.application_name.split('_')[1]);
            return numA - numB;
        });

        for (const app of results) {
            const { application_name, latest_version, current_versions } = app;

            const drift = {};
            for (const key of Object.keys(current_versions)) {
                drift[key] = { ...current_versions[key] };
            }

            transformedData.push({
                [application_name]: {
                    latest: latest_version,
                    drift
                }
            });
        }

        res.status(200).json(transformedData);
        });
};

// Inject dependencies into routes
app.post('/release',authenticateApiKey, createReleaseRoute(db));
app.get('/releases',authenticateApiKey, listReleasesRoute(db));
app.get('/drift',authenticateApiKey, detectDriftRoute(db));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});