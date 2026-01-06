// ============================================================
// Gaming Tournament Tracker - Web App (Step 3 Draft)
// Group 59 - Aidan Caughey, Baron Baker
// ============================================================

const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');

const app = express();

// Port assignment
const PORT = process.env.PORT || 5124;

// ----------------------
// MySQL connection pool
// ----------------------
const db = mysql.createPool({
  host: 'classmysql.engr.oregonstate.edu',
  user: 'cs340_bakerbar',   
  password: '8756', 
  database: 'cs340_bakerbar'  
});

// ----------------------
// View engine setup
// ----------------------
app.engine('.hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main'
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// ----------------------
// Middleware
// ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------
// Home / Index
// ----------------------
app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Gaming Tournament Tracker'
  });
});

// ======================================================================
// PLAYERS – SELECT / INSERT / UPDATE / DELETE
// ======================================================================

// READ
app.get('/players', async (req, res) => {
  try {
    const [players] = await db.query(`
      SELECT 
        playerID,
        username,
        email,
        DATE_FORMAT(joinDate, '%Y-%m-%d') AS joinDate,
        rank
      FROM Players
      ORDER BY playerID ASC;
    `);

    res.render('players', {
      pageTitle: 'Manage Players',
      players
    });
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).send('Error fetching players');
  }
});

// CREATE
app.post('/players/add', async (req, res) => {
  const { usernameInput, emailInput, rankInput } = req.body;

  try {
    await db.query(
      `INSERT INTO Players (username, email, rank)
       VALUES (?, ?, ?)`,
      [usernameInput, emailInput, rankInput || null]
    );
    res.redirect('/players');
  } catch (err) {
    console.error('Error adding player:', err);
    res.status(500).send('Error adding player');
  }
});

// UPDATE
app.post('/players/update', async (req, res) => {
  const { playerID, usernameInput, emailInput, rankInput } = req.body;

  try {
    await db.query(
      `UPDATE Players
       SET
         username = IFNULL(NULLIF(?, ''), username),
         email    = IFNULL(NULLIF(?, ''), email),
         rank     = IFNULL(NULLIF(?, ''), rank)
       WHERE playerID = ?`,
      [usernameInput, emailInput, rankInput, playerID]
    );
    res.redirect('/players');
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).send('Error updating player');
  }
});

// DELETE
app.post('/players/delete', async (req, res) => {
  const { playerID } = req.body;

  try {
    await db.query(
      `DELETE FROM Players WHERE playerID = ?`,
      [playerID]
    );
    res.redirect('/players');
  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).send('Error deleting player');
  }
});

// ======================================================================
// TOURNAMENTS – SELECT / INSERT / UPDATE / DELETE
// ======================================================================

// READ
app.get('/tournaments', async (req, res) => {
  try {
    const [tournaments] = await db.query(`
      SELECT
        tournamentID,
        title,
        game,
        DATE_FORMAT(startDate, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(endDate, '%Y-%m-%d') AS endDate,
        maxPlayers
      FROM Tournaments
      ORDER BY tournamentID ASC;
    `);

    res.render('tournaments', {
      pageTitle: 'Manage Tournaments',
      tournaments
    });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).send('Error fetching tournaments');
  }
});

// CREATE
app.post('/tournaments/add', async (req, res) => {
  const {
    titleInput,
    gameInput,
    startDateInput,
    endDateInput,
    maxPlayersInput
  } = req.body;

  try {
    await db.query(
      `INSERT INTO Tournaments (title, game, startDate, endDate, maxPlayers)
       VALUES (?, ?, ?, ?, ?)`,
      [titleInput, gameInput, startDateInput, endDateInput, maxPlayersInput]
    );
    res.redirect('/tournaments');
  } catch (err) {
    console.error('Error adding tournament:', err);
    res.status(500).send('Error adding tournament');
  }
});

// UPDATE
app.post('/tournaments/update', async (req, res) => {
  const {
    tournamentID,
    titleInput,
    gameInput,
    startDateInput,
    endDateInput,
    maxPlayersInput
  } = req.body;

  try {
    await db.query(
      `UPDATE Tournaments
       SET
         title      = IFNULL(NULLIF(?, ''), title),
         game       = IFNULL(NULLIF(?, ''), game),
         startDate  = IFNULL(NULLIF(?, ''), startDate),
         endDate    = IFNULL(NULLIF(?, ''), endDate),
         maxPlayers = IFNULL(NULLIF(?, ''), maxPlayers)
       WHERE tournamentID = ?`,
      [titleInput, gameInput, startDateInput, endDateInput, maxPlayersInput, tournamentID]
    );
    res.redirect('/tournaments');
  } catch (err) {
    console.error('Error updating tournament:', err);
    res.status(500).send('Error updating tournament');
  }
});

// DELETE
app.post('/tournaments/delete', async (req, res) => {
  const { tournamentID } = req.body;

  try {
    await db.query(
      `DELETE FROM Tournaments WHERE tournamentID = ?`,
      [tournamentID]
    );
    res.redirect('/tournaments');
  } catch (err) {
    console.error('Error deleting tournament:', err);
    res.status(500).send('Error deleting tournament');
  }
});

// ======================================================================
// REGISTRATIONS (M:M Players <-> Tournaments)
// SELECT with JOINs + INSERT / UPDATE / DELETE
// ======================================================================

// READ (with joins for user-friendly display)
app.get('/registrations', async (req, res) => {
  try {
    const [registrations] = await db.query(`
      SELECT
        r.registrationID,
        DATE_FORMAT(r.registrationDate, '%Y-%m-%d %H:%i:%s') AS registrationDate,
        r.playerID,
        p.username AS playerName,
        r.tournamentID,
        t.title    AS tournamentTitle
      FROM Registrations r
      INNER JOIN Players     p ON r.playerID     = p.playerID
      INNER JOIN Tournaments t ON r.tournamentID = t.tournamentID
      ORDER BY r.registrationID ASC;
    `);

    const [playersList] = await db.query(`
      SELECT playerID, username AS playerName
      FROM Players
      ORDER BY username ASC;
    `);

    const [tournamentsList] = await db.query(`
      SELECT tournamentID, title AS tournamentTitle
      FROM Tournaments
      ORDER BY title ASC;
    `);

    res.render('registrations', {
      pageTitle: 'Manage Registrations',
      registrations,
      playersList,
      tournamentsList
    });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).send('Error fetching registrations');
  }
});

// CREATE
app.post('/registrations/add', async (req, res) => {
  const { playerID, tournamentID } = req.body;

  try {
    await db.query(
      `INSERT INTO Registrations (playerID, tournamentID)
       VALUES (?, ?)`,
      [playerID, tournamentID]
    );
    res.redirect('/registrations');
  } catch (err) {
    console.error('Error adding registration:', err);
    res.status(500).send('Error adding registration');
  }
});

// UPDATE (M:M update)
app.post('/registrations/update', async (req, res) => {
  const { registrationID, playerID, tournamentID } = req.body;

  try {
    await db.query(
      `UPDATE Registrations
       SET
         playerID     = IFNULL(NULLIF(?, ''), playerID),
         tournamentID = IFNULL(NULLIF(?, ''), tournamentID)
       WHERE registrationID = ?`,
      [playerID, tournamentID, registrationID]
    );
    res.redirect('/registrations');
  } catch (err) {
    console.error('Error updating registration:', err);
    res.status(500).send('Error updating registration');
  }
});

// DELETE (M:M delete, only removes the link, not the player/tournament)
app.post('/registrations/delete', async (req, res) => {
  const { registrationID } = req.body;

  try {
    await db.query(
      `DELETE FROM Registrations WHERE registrationID = ?`,
      [registrationID]
    );
    res.redirect('/registrations');
  } catch (err) {
    console.error('Error deleting registration:', err);
    res.status(500).send('Error deleting registration');
  }
});

// ======================================================================
// MATCHES – SELECT / INSERT / UPDATE / DELETE
// ======================================================================

// READ
app.get('/matches', async (req, res) => {
  try {
    const [matches] = await db.query(`
      SELECT
        m.matchID,
        m.tournamentID,
        t.title AS tournamentTitle,
        m.round,
        DATE_FORMAT(m.matchDate, '%Y-%m-%d %H:%i:%s') AS matchDate,
        m.status
      FROM Matches m
      INNER JOIN Tournaments t ON m.tournamentID = t.tournamentID
      ORDER BY m.matchID ASC;
    `);

    const [tournamentsList] = await db.query(`
      SELECT tournamentID, title AS tournamentTitle
      FROM Tournaments
      ORDER BY title ASC;
    `);

    res.render('matches', {
      pageTitle: 'Manage Matches',
      matches,
      tournamentsList
    });
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).send('Error fetching matches');
  }
});

// CREATE
app.post('/matches/add', async (req, res) => {
  const { tournamentID, roundInput, matchDateInput, statusInput } = req.body;

  try {
    await db.query(
      `INSERT INTO Matches (tournamentID, round, matchDate, status)
       VALUES (?, ?, ?, ?)`,
      [tournamentID, roundInput, matchDateInput || null, statusInput || 'Scheduled']
    );
    res.redirect('/matches');
  } catch (err) {
    console.error('Error adding match:', err);
    res.status(500).send('Error adding match');
  }
});

// UPDATE
app.post('/matches/update', async (req, res) => {
  const { matchID, tournamentID, roundInput, matchDateInput, statusInput } = req.body;

  try {
    await db.query(
      `UPDATE Matches
       SET
         tournamentID = IFNULL(NULLIF(?, ''), tournamentID),
         round        = IFNULL(NULLIF(?, ''), round),
         matchDate    = IFNULL(NULLIF(?, ''), matchDate),
         status       = IFNULL(NULLIF(?, ''), status)
       WHERE matchID = ?`,
      [tournamentID, roundInput, matchDateInput, statusInput, matchID]
    );
    res.redirect('/matches');
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).send('Error updating match');
  }
});

// DELETE
app.post('/matches/delete', async (req, res) => {
  const { matchID } = req.body;

  try {
    await db.query(
      `DELETE FROM Matches WHERE matchID = ?`,
      [matchID]
    );
    res.redirect('/matches');
  } catch (err) {
    console.error('Error deleting match:', err);
    res.status(500).send('Error deleting match');
  }
});

// ======================================================================
// MATCH RESULTS – SELECT / INSERT / UPDATE / DELETE
// ======================================================================

// READ
app.get('/match-results', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT
        r.resultID,
        r.matchID,
        r.playerID,
        r.score,
        r.result,
        m.round,
        DATE_FORMAT(m.matchDate, '%Y-%m-%d %H:%i:%s') AS matchDate,
        t.title   AS tournamentTitle,
        p.username AS playerName
      FROM MatchResults r
      INNER JOIN Matches     m ON r.matchID = m.matchID
      INNER JOIN Tournaments t ON m.tournamentID = t.tournamentID
      INNER JOIN Players     p ON r.playerID = p.playerID
      ORDER BY r.resultID ASC;
    `);

    const [playersList] = await db.query(`
      SELECT playerID, username AS playerName
      FROM Players
      ORDER BY username ASC;
    `);

    const [matchesList] = await db.query(`
      SELECT
        m.matchID,
        CONCAT(t.title, ' - Round ', m.round) AS matchLabel
      FROM Matches m
      INNER JOIN Tournaments t ON m.tournamentID = t.tournamentID
      ORDER BY m.matchID ASC;
    `);

    res.render('matchResults', {
      pageTitle: 'Manage Match Results',
      results,
      playersList,
      matchesList
    });
  } catch (err) {
    console.error('Error fetching match results:', err);
    res.status(500).send('Error fetching match results');
  }
});

// CREATE
app.post('/match-results/add', async (req, res) => {
  const { matchID, playerID, scoreInput, resultInput } = req.body;

  try {
    await db.query(
      `INSERT INTO MatchResults (matchID, playerID, score, result)
       VALUES (?, ?, ?, ?)`,
      [matchID, playerID, scoreInput, resultInput]
    );
    res.redirect('/match-results');
  } catch (err) {
    console.error('Error adding match result:', err);
    res.status(500).send('Error adding match result');
  }
});

// UPDATE
app.post('/match-results/update', async (req, res) => {
  const { resultID, matchID, playerID, scoreInput, resultInput } = req.body;

  try {
    await db.query(
      `UPDATE MatchResults
       SET
         matchID = IFNULL(NULLIF(?, ''), matchID),
         playerID = IFNULL(NULLIF(?, ''), playerID),
         score = IFNULL(NULLIF(?, ''), score),
         result = IFNULL(NULLIF(?, ''), result)
       WHERE resultID = ?`,
      [matchID, playerID, scoreInput, resultInput, resultID]
    );
    res.redirect('/match-results');
  } catch (err) {
    console.error('Error updating match result:', err);
    res.status(500).send('Error updating match result');
  }
});

// DELETE
app.post('/match-results/delete', async (req, res) => {
  const { resultID } = req.body;

  try {
    await db.query(
      `DELETE FROM MatchResults WHERE resultID = ?`,
      [resultID]
    );
    res.redirect('/match-results');
  } catch (err) {
    console.error('Error deleting match result:', err);
    res.status(500).send('Error deleting match result');
  }
});

// ======================================================================
// LEADERBOARDS – SELECT / INSERT / UPDATE / DELETE
// ======================================================================

// READ
app.get('/leaderboards', async (req, res) => {
  try {
    const [leaderboards] = await db.query(`
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
      INNER JOIN Players     p ON l.playerID   = p.playerID
      ORDER BY l.leaderboardID ASC;
    `);

    const [playersList] = await db.query(`
      SELECT playerID, username AS playerName
      FROM Players
      ORDER BY username ASC;
    `);

    const [tournamentsList] = await db.query(`
      SELECT tournamentID, title AS tournamentTitle
      FROM Tournaments
      ORDER BY title ASC;
    `);

    res.render('leaderboards', {
      pageTitle: 'Manage Leaderboards',
      leaderboards,
      playersList,
      tournamentsList
    });
  } catch (err) {
    console.error('Error fetching leaderboards:', err);
    res.status(500).send('Error fetching leaderboards');
  }
});

// CREATE
app.post('/leaderboards/add', async (req, res) => {
  const { tournamentID, playerID, pointsInput, placementInput } = req.body;

  try {
    await db.query(
      `INSERT INTO Leaderboards (tournamentID, playerID, points, placement)
       VALUES (?, ?, ?, ?)`,
      [tournamentID, playerID, pointsInput || 0, placementInput || null]
    );
    res.redirect('/leaderboards');
  } catch (err) {
    console.error('Error adding leaderboard entry:', err);
    res.status(500).send('Error adding leaderboard entry');
  }
});

// UPDATE
app.post('/leaderboards/update', async (req, res) => {
  const { leaderboardID, tournamentID, playerID, pointsInput, placementInput } = req.body;

  try {
    await db.query(
      `UPDATE Leaderboards
       SET
         tournamentID = IFNULL(NULLIF(?, ''), tournamentID),
         playerID     = IFNULL(NULLIF(?, ''), playerID),
         points       = IFNULL(NULLIF(?, ''), points),
         placement    = IFNULL(NULLIF(?, ''), placement)
       WHERE leaderboardID = ?`,
      [tournamentID, playerID, pointsInput, placementInput, leaderboardID]
    );
    res.redirect('/leaderboards');
  } catch (err) {
    console.error('Error updating leaderboard entry:', err);
    res.status(500).send('Error updating leaderboard entry');
  }
});

// DELETE
app.post('/leaderboards/delete', async (req, res) => {
  const { leaderboardID } = req.body;

  try {
    await db.query(
      `DELETE FROM Leaderboards WHERE leaderboardID = ?`,
      [leaderboardID]
    );
    res.redirect('/leaderboards');
  } catch (err) {
    console.error('Error deleting leaderboard entry:', err);
    res.status(500).send('Error deleting leaderboard entry');
  }
});

// ----------------------
// 404 fallback
// ----------------------
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});