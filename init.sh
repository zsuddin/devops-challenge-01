#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Creating MySQL $DB_USER"

mysql --user=root --password=$MYSQL_ROOT_PASSWORD -h mysql -P 3306 $MYSQL_DATABASE --execute "
    CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
    GRANT SELECT, INSERT, UPDATE ON releases_db.releases TO '$DB_USER'@'%';
    GRANT SELECT, INSERT, UPDATE ON top_secret_db.users TO '$DB_USER'@'%';
    FLUSH PRIVILEGES;
"

echo "User created successfully!"