-- Create user and grant privileges
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'kJi51CFJrgpGwXf';

CREATE DATABASE IF NOT EXISTS top_secret_db;
USE top_secret_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (username, password) VALUES ('admin', 'admin');
INSERT INTO users (username, password) VALUES ('bart', 'cowabunga1');

CREATE DATABASE IF NOT EXISTS releases_db;
USE releases_db;

CREATE TABLE IF NOT EXISTS releases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    account VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

  -- Use '%' to allow connections from any host
GRANT SELECT, INSERT, UPDATE ON releases_db.releases TO 'appuser'@'%';
GRANT SELECT, INSERT, UPDATE ON top_secret_db.users TO 'appuser'@'%';
-- FLUSH PRIVILEGES;