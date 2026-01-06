/* ===========================================================
   TournamentTracker_DML.sql
   Group 59 - Step 3 FINAL
   Note: Variables are written as :varName
   =========================================================== */

-- =========================================
-- PLAYERS
-- =========================================

-- READ all players
SELECT playerID, username, email, joinDate, rank
FROM Players
ORDER BY playerID ASC;

-- INSERT a new player
INSERT INTO Players (username, email, rank)
VALUES (:usernameInput, :emailInput, :rankInput);

-- UPDATE a player (blank values keep existing)
UPDATE Players
SET
  username = IFNULL(NULLIF(:usernameInput, ''), username),
  email    = IFNULL(NULLIF(:emailInput, ''),    email),
  rank     = IFNULL(NULLIF(:rankInput, ''),     rank)
WHERE playerID = :playerID;

-- DELETE a player
DELETE FROM Players
WHERE playerID = :playerID;


-- =========================================
-- TOURNAMENTS
-- =========================================

-- READ all tournaments
SELECT tournamentID, title, game, startDate, endDate, maxPlayers
FROM Tournaments
ORDER BY tournamentID ASC;

-- INSERT a new tournament
INSERT INTO Tournaments (title, game, startDate, endDate, maxPlayers)
VALUES (:titleInput, :gameInput, :startDateInput, :endDateInput, :maxPlayersInput);

-- UPDATE a tournament
UPDATE Tournaments
SET
  title      = IFNULL(NULLIF(:titleInput, ''),      title),
  game       = IFNULL(NULLIF(:gameInput, ''),       game),
  startDate  = IFNULL(NULLIF(:startDateInput, ''),  startDate),
  endDate    = IFNULL(NULLIF(:endDateInput, ''),    endDate),
  maxPlayers = IFNULL(NULLIF(:maxPlayersInput, ''), maxPlayers)
WHERE tournamentID = :tournamentID;

-- DELETE a tournament
DELETE FROM Tournaments
WHERE tournamentID = :tournamentID;


-- =========================================
-- REGISTRATIONS (M:M Players <-> Tournaments)
-- =========================================

-- READ with JOINs for user-friendly FK display
SELECT
  r.registrationID,
  r.registrationDate,
  r.playerID,
  p.username AS playerName,
  r.tournamentID,
  t.title    AS tournamentTitle
FROM Registrations r
INNER JOIN Players     p ON r.playerID     = p.playerID
INNER JOIN Tournaments t ON r.tournamentID = t.tournamentID
ORDER BY r.registrationID ASC;

-- INSERT new registration
INSERT INTO Registrations (playerID, tournamentID)
VALUES (:playerID, :tournamentID);

-- UPDATE registration (change which player/tournament are linked)
UPDATE Registrations
SET
  playerID     = IFNULL(NULLIF(:playerID, ''),     playerID),
  tournamentID = IFNULL(NULLIF(:tournamentID, ''), tournamentID)
WHERE registrationID = :registrationID;

-- DELETE a registration (removes only the link in the M:M table)
DELETE FROM Registrations
WHERE registrationID = :registrationID;


-- =========================================
-- MATCHES
-- =========================================

-- READ matches with tournament info
SELECT
  m.matchID,
  m.tournamentID,
  t.title AS tournamentTitle,
  m.round,
  m.matchDate,
  m.status
FROM Matches m
INNER JOIN Tournaments t ON m.tournamentID = t.tournamentID
ORDER BY m.matchID ASC;

-- INSERT a new match
INSERT INTO Matches (tournamentID, round, matchDate, status)
VALUES (:tournamentID, :roundInput, :matchDateInput, :statusInput);

-- UPDATE a match
UPDATE Matches
SET
  tournamentID = IFNULL(NULLIF(:tournamentID, ''), tournamentID),
  round        = IFNULL(NULLIF(:roundInput, ''),    round),
  matchDate    = IFNULL(NULLIF(:matchDateInput, ''), matchDate),
  status       = IFNULL(NULLIF(:statusInput, ''),   status)
WHERE matchID = :matchID;

-- DELETE a match
DELETE FROM Matches
WHERE matchID = :matchID;


-- =========================================
-- MATCH RESULTS
-- =========================================

-- READ results with player + match + tournament info
SELECT
  r.resultID,
  r.matchID,
  r.playerID,
  r.score,
  r.result,
  m.round,
  m.matchDate,
  t.title   AS tournamentTitle,
  p.username AS playerName
FROM MatchResults r
INNER JOIN Matches     m ON r.matchID = m.matchID
INNER JOIN Tournaments t ON m.tournamentID = t.tournamentID
INNER JOIN Players     p ON r.playerID = p.playerID
ORDER BY r.resultID ASC;

-- INSERT a match result
INSERT INTO MatchResults (matchID, playerID, score, result)
VALUES (:matchID, :playerID, :scoreInput, :resultInput);

-- UPDATE a match result
UPDATE MatchResults
SET
  matchID  = IFNULL(NULLIF(:matchID, ''),  matchID),
  playerID = IFNULL(NULLIF(:playerID, ''), playerID),
  score    = IFNULL(NULLIF(:scoreInput, ''), score),
  result   = IFNULL(NULLIF(:resultInput, ''), result)
WHERE resultID = :resultID;

-- DELETE a match result
DELETE FROM MatchResults
WHERE resultID = :resultID;


-- =========================================
-- LEADERBOARDS
-- =========================================

-- READ leaderboard entries with player + tournament info
SELECT
  l.leaderboardID,
  l.tournamentID,
  l.playerID,
  l.points,
  l.placement,
  t.title    AS tournamentTitle,
  p.username AS playerName
FROM Leaderboards l
INNER JOIN Tournaments t ON l.tournamentID = t.tournamentID
INNER JOIN Players     p ON l.playerID = p.playerID
ORDER BY l.leaderboardID ASC;

-- INSERT leaderboard entry
INSERT INTO Leaderboards (tournamentID, playerID, points, placement)
VALUES (:tournamentID, :playerID, :pointsInput, :placementInput);

-- UPDATE leaderboard entry
UPDATE Leaderboards
SET
  tournamentID = IFNULL(NULLIF(:tournamentID, ''), tournamentID),
  playerID     = IFNULL(NULLIF(:playerID, ''),     playerID),
  points       = IFNULL(NULLIF(:pointsInput, ''),  points),
  placement    = IFNULL(NULLIF(:placementInput, ''), placement)
WHERE leaderboardID = :leaderboardID;

-- DELETE leaderboard entry
DELETE FROM Leaderboards
WHERE leaderboardID = :leaderboardID;
