/* ===========================================================
   PL.SQL
   Group 59 - Step 4 Stored Procedures
   Members: Aidan Caughey & Baron Baker
   =========================================================== */

SET FOREIGN_KEY_CHECKS = 0;
DELIMITER //

/* -----------------------------------------------------------
   1. ResetTournamentTracker()
----------------------------------------------------------- */
CREATE PROCEDURE ResetTournamentTracker()
BEGIN
    /* Drop in reverse FK dependency order */
    DROP TABLE IF EXISTS Leaderboards;
    DROP TABLE IF EXISTS MatchResults;
    DROP TABLE IF EXISTS Matches;
    DROP TABLE IF EXISTS Registrations;
    DROP TABLE IF EXISTS Tournaments;
    DROP TABLE IF EXISTS Players;

    /* ==========================
       RECREATE TABLES
       ========================== */

    -- Players
    CREATE TABLE Players (
        playerID INT AUTO_INCREMENT UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        joinDate DATE NOT NULL DEFAULT (CURRENT_DATE),
        rank VARCHAR(20) NULL,
        PRIMARY KEY(playerID)
    );

    -- Tournaments
    CREATE TABLE Tournaments (
        tournamentID INT AUTO_INCREMENT UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        game VARCHAR(50) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        maxPlayers INT NOT NULL,
        PRIMARY KEY(tournamentID)
    );

    -- Registrations
    CREATE TABLE Registrations (
        registrationID INT AUTO_INCREMENT UNIQUE NOT NULL,
        playerID INT NOT NULL,
        tournamentID INT NOT NULL,
        registrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(registrationID),
        FOREIGN KEY (playerID) REFERENCES Players(playerID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (tournamentID) REFERENCES Tournaments(tournamentID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (playerID, tournamentID)
    );

    -- Matches
    CREATE TABLE Matches (
        matchID INT AUTO_INCREMENT UNIQUE NOT NULL,
        tournamentID INT NOT NULL,
        round INT NOT NULL,
        matchDate DATETIME NULL,
        status ENUM('Scheduled', 'Completed') DEFAULT 'Scheduled',
        PRIMARY KEY(matchID),
        FOREIGN KEY (tournamentID) REFERENCES Tournaments(tournamentID)
            ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- MatchResults
    CREATE TABLE MatchResults (
        resultID INT AUTO_INCREMENT UNIQUE NOT NULL,
        matchID INT NOT NULL,
        playerID INT NOT NULL,
        score INT NOT NULL,
        result ENUM('Win','Loss') NOT NULL,
        PRIMARY KEY(resultID),
        FOREIGN KEY (matchID) REFERENCES Matches(matchID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (playerID) REFERENCES Players(playerID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (matchID, playerID)
    );

    -- Leaderboards
    CREATE TABLE Leaderboards (
        leaderboardID INT AUTO_INCREMENT UNIQUE NOT NULL,
        tournamentID INT NOT NULL,
        playerID INT NOT NULL,
        points INT NOT NULL DEFAULT 0,
        placement INT NULL,
        PRIMARY KEY(leaderboardID),
        FOREIGN KEY (tournamentID) REFERENCES Tournaments(tournamentID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (playerID) REFERENCES Players(playerID)
            ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (tournamentID, playerID)
    );

    /* ==========================
       INSERT SEED DATA
       ========================== */

    -- Players
    INSERT INTO Players (username, email, rank)
    VALUES 
        ('Gamer Boy', 'gamerb@gmail.com', 'Gold'),
        ('Gamer Girl', 'gamerg@gmail.com', 'Silver'),
        ('Stefan Lee', 'leestefan@gmail.com', 'Bronze'),
        ('Freddie Freeman', 'FreemanF@gmail.com', NULL);

    -- Tournaments
    INSERT INTO Tournaments (title, game, startDate, endDate, maxPlayers)
    VALUES
        ('Shaolin Showdown', 'Valorant', '2025-09-01', '2025-09-15', 64),
        ('Winter Games', 'Rocket League', '2025-12-10', '2025-12-20', 32),
        ('Overwatch Cup', 'Overwatch 2', '2026-03-05', '2026-03-18', 128);

    -- Registrations
    INSERT INTO Registrations (playerID, tournamentID)
    VALUES
        (1, 1),
        (2, 1),
        (3, 2),
        (4, 3),
        (1, 3);

    -- Matches
    INSERT INTO Matches (tournamentID, round, matchDate, status)
    VALUES
        (1, 1, '2025-09-02 15:00:00', 'Completed'),
        (1, 2, '2025-09-10 16:00:00', 'Scheduled'),
        (2, 1, '2025-12-11 17:00:00', 'Scheduled');

    -- MatchResults
    INSERT INTO MatchResults (matchID, playerID, score, result)
    VALUES
        (1, 1, 15, 'Win'),
        (1, 2, 10, 'Loss'),
        (3, 3, 8, 'Win'),
        (3, 4, 5, 'Loss');

    -- Leaderboards
    INSERT INTO Leaderboards (tournamentID, playerID, points, placement)
    VALUES
        (1, 1, 150, 1),
        (1, 2, 120, 2),
        (2, 3, 100, 1),
        (3, 4, 90, 2),
        (3, 1, 110, 1);

END //
/* End ResetTournamentTracker() */


/* -----------------------------------------------------------
   2. DemoDeletePlayer()
----------------------------------------------------------- */
CREATE PROCEDURE DemoDeletePlayer()
BEGIN
    /* Delete a predictable example row */
    DELETE FROM Players
    WHERE username = 'Gamer Boy';
END //


/* -----------------------------------------------------------
   3. UpdatePlayerInfo()
----------------------------------------------------------- */
CREATE PROCEDURE UpdatePlayerInfo(
    IN p_playerID INT,
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_rank VARCHAR(20)
)
BEGIN
    UPDATE Players
    SET
        username = IFNULL(NULLIF(p_username, ''), username),
        email    = IFNULL(NULLIF(p_email, ''), email),
        rank     = IFNULL(NULLIF(p_rank, ''), rank)
    WHERE playerID = p_playerID;
END //

DELIMITER ;
SET FOREIGN_KEY_CHECKS = 1;
