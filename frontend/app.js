const express = require('express');
const axios = require('axios');
const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080'; // Docker Compose service name

app.use(express.static(__dirname));
app.use(express.urlencoded({extended:true})); // For form POST parsing

app.get('/', (req, res) => {
    
res.send(`
    <html>
    <head>
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
      <div class="logo-wrapper">
        <img src="assets/sdn_logo.png" alt="SDN logo" class="logo" />
      </div>
      <div class="container">
        <div>
          <h2>Hello Welcome to Superhero Dispatch Network User</h2>
        </div>
        <div class="form-container">
          <form method="POST" action="/">
            <label for="username">Enter username:</label>
            <input type="text" name="username"/>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </body>
    </html>`);
});

app.post('/', async (req, res) => {
    const username = req.body.username || '';
    console.log(`Received POST request with username: ${username}`);
    let superHeroName = 'User';
    try {
        console.log(`Calling backend API for username: ${username}`);
        const result = await axios.get(`${BACKEND_URL}/superhero`, {
            params: { username }
        });
        superHeroName = result.data.superHeroName || 'User';
        console.log(`Received super hero name: ${superHeroName} for username: ${username}`);
    } catch (error) {
        console.error(`Error calling backend for username ${username}:`, error.message);
        // fallback to 'User'
    }
    
res.send(`
    <html>
    <head>
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
      <div class="logo-wrapper">
        <img src="assets/sdn_logo.png" alt="SDN logo" class="logo" />
      </div>
      <div class="container">
        <div>
          <h2>Hello Welcome to Superhero Dispatch Network ${superHeroName}</h2>
        </div>
        <div class="form-container">
          <form method="POST" action="/">
            <label for="username">Enter username:</label>
            <input type="text" name="username"/>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </body>
    </html>`);
});

const port = 6160;
app.listen(port, () => {
    console.log(`Frontend server started on port ${port}`);
});
