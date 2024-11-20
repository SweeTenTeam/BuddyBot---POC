CREATE TABLE chat(
    id INT PRIMARY KEY NOT NULL,
    question VARCHAR(255),
    answer VARCHAR(255)
);

INSERT INTO chat(id,question,answer) VALUES (12345,'Question','Answer');