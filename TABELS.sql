CREATE TABLE Lindvalen (
    totaltPrisStuga int,
    forsakring int,
    hyraUtrustning int,
    buss int,
    skiPass int
);

INSERT INTO Lindvalen (totaltPrisStuga, forsakring, hyraUtrustning, buss, skiPass) VALUES (12915, 595, 992, 1000, 2277);


CREATE TABLE People (
    name varchar(255),
    inbetalat int
);


INSERT INTO People (name, inbetalat) VALUES ("Aom", 1125);
INSERT INTO People (name, inbetalat) VALUES ("Filip G", 300);
INSERT INTO People (name, inbetalat) VALUES ("Philip J", 1150);
INSERT INTO People (name, inbetalat) VALUES ("Filip L", 500);
INSERT INTO People (name, inbetalat) VALUES ("Casper", 425);
INSERT INTO People (name, inbetalat) VALUES ("Samuel", 425);
INSERT INTO People (name, inbetalat) VALUES ("Hanna", 1225);
INSERT INTO People (name, inbetalat) VALUES ("Felix", 1025);