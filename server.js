const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

app.post('/run-ffmpeg', (req, res) => {
    const command = req.body.command;
    if (!command) return res.status(400).send('Missing FFmpeg command');

    exec(`ffmpeg ${command}`, (error, stdout, stderr) => {
        if (error) return res.status(500).send(stderr);
        res.send(stdout);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
