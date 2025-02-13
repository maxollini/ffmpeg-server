const express = require('express');
const app = express();  // Only declare express once here
const { exec } = require('child_process');
const path = require('path');
const publicPath = path.join(__dirname, 'public');
const fs = require('fs');
if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
}
app.use('/images', express.static(publicPath));
app.use(express.json());

app.post('/generate-image', async (req, res) => {
    const videoUrl = req.body.videoUrl;
    if (!videoUrl) return res.status(400).send('Missing video URL');

    const outputImage = path.join(publicPath, `output_${Date.now()}.jpg`);

    // Get video duration using FFprobe
    exec(`ffprobe -i "${videoUrl}" -show_entries format=duration -v quiet -of csv="p=0"`, (error, duration, stderr) => {
        if (error) return res.status(500).send(stderr);

        duration = Math.floor(parseFloat(duration)); // Convert duration to seconds
        if (duration < 2) return res.status(400).send('Video too short');

        // Generate timestamps based on video duration
        let timestamps = [1];
        let steps = Math.max(1, Math.floor(duration / 5));
        for (let i = 1; i < 5; i++) {
            let ts = Math.min(1 + i * steps, duration - 1);
            if (!timestamps.includes(ts)) timestamps.push(ts);
        }

        // Get video width for horizontal offset
        exec(`ffprobe -i "${videoUrl}" -show_entries stream=width -v quiet -of csv="p=0"`, (error, width, stderr) => {
            if (error) return res.status(500).send(stderr);

            width = parseInt(width); // Video width in pixels

            // FFmpeg command to extract frames and stack horizontally with offset
            const filters = timestamps.map((t, i) => `eq(n\\,${t})`).join("+");
            const command = `ffmpeg -i "${videoUrl}" -vf "select='${timestamps.map(t => `gte(t,${t})`).join('+')}',scale=${width}:-1,tile=${timestamps.length}x1" -frames:v 1 -y "${outputImage}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) return res.status(500).send(stderr);
                res.json({ imageUrl: `https://ffmpeg-server-t9j2.onrender.com/images/${path.basename(outputImage)}` });
            });
        });
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
