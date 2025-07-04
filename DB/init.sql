CREATE DATABASE IF NOT EXISTS vocab_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE vocab_app;

CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255)
    );

CREATE TABLE IF NOT EXISTS words (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     word VARCHAR(255),
    translation VARCHAR(255),
    meaning TEXT,
    verb1 VARCHAR(255),
    verb2 VARCHAR(255),
    verb3 VARCHAR(255),
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );