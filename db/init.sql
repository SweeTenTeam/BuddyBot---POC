CREATE TABLE chat(
    id SERIAL PRIMARY KEY, -- https://www.tutorialspoint.com/postgresql/postgresql_using_autoincrement.htm
    question VARCHAR(5000),
    answer VARCHAR(5000)
);

INSERT INTO chat(question,answer) VALUES ('Question','Answer'); -- to be removed maybe