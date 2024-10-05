const API_KEY = process.env.API_KEY;

const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

module.exports = { authenticateApiKey };