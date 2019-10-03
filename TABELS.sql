DROP TABLE Lindvalen; 
DROP TABLE People;

CREATE TABLE Lindvalen (
    totaltPrisStuga int,
    forsakring int,
    hyraUtrustning int,
    buss int,
    skiPass int
);

INSERT INTO Lindvalen (totaltPrisStuga, forsakring, hyraUtrustning, buss, skiPass) VALUES (12915, 595, 992, 1428, 2277);


CREATE TABLE People (
    name varchar(255),
    inbetalat int,
    inbetalatBuss int
);


INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Aom", 1689, 800);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Filip G", 300, 0);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Philip J", 1150, 1428);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Filip L", 500, 0);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Casper", 425, 0);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Samuel", 425, 1424);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Hanna", 1615, 1428);
INSERT INTO People (name, inbetalat, inbetalatBuss) VALUES ("Felix", 1025, 0);