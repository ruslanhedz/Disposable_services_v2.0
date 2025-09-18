CREATE DATABASE django_migrations;
CREATE DATABASE reg_log;

GRANT ALL PRIVILEGES ON django_migrations.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON reg_log.* TO 'admin'@'%';
FLUSH PRIVILEGES;