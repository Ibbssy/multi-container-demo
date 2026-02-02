const express = require('express');
const axios = require('axios');
const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080'; // Docker Compose service name

app.use(express.urlencoded({extended:true})); // For form POST parsing

app.get('/', (req, res) => {
    res.send(`
    <form method="POST" action="/">
      <label for="username">Enter username:</label>
      <input type="text" name="username"/>
      <button type="submit">Submit</button>
    </form>
    <h2>Hello Welcome to NOT Disneyland User</h2>`);
});

app.post('/', async (req, res) => {
    const username = req.body.username || '';
    let superHeroName = 'User';
    try {
        const result = await axios.get(`${BACKEND_URL}/superhero`, {
            params: { username }
        });
        superHeroName = result.data.superHeroName || 'User';
    } catch (error) {
        console.error(error);
        // fallback to 'User'
    }
    res.send(`
    <form method="POST" action="/">
      <label for="username">Enter username:</label>
      <input type="text" name="username"/>
      <button type="submit">Submit</button>
    </form>
    <h2>Hello Welcome to ComicsVerse ${superHeroName}</h2>`);
});

const port = 6160;
app.listen(port, () => {
    console.log(`Frontend running on port ${port}`);
});