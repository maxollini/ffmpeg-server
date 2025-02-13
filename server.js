const express = require('express');
const { exec } = require('child_process');

const app = express();
const path = require('path');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.json());

app.post('/run-ffmpeg', (req, res) => {
    const command = req.body.command;
    if (!command) return res.status(400).send('Missing FFmpeg command');

    exec(`ffmpeg ${command}`, (error, stdout, stderr) => {
        if (error) return res.status(500).send(stderr);
        res.send(stdout);
    });
});
app.post('/generate-image', async (req, res) => {
    const videoUrl = req.body.videoUrl;
    if (!videoUrl) return res.status(400).send('Missing video URL');

    const outputImage = path.join(publicPath, `output_${Date.now()}.jpg`);

    const command = `ffmpeg -i "${videoUrl}" -vf "select='not(mod(n\\,10))',scale=-1:300,tile=1x10" -frames:v 1 ${outputImage}`;

    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).send(stderr);
        res.json({ imageUrl: `https://ffmpeg-server-t9j2.onrender.com/${outputImage}` });
    });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
