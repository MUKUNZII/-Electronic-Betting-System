UPDATE mysql.user SET Password='' WHERE User='root';
UPDATE mysql.user SET authentication_string='' WHERE User='root';
UPDATE mysql.user SET plugin='mysql_native_password' WHERE User='root';
FLUSH PRIVILEGES;
