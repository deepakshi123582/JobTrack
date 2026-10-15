const net = require("net");

app.get("/api/test-network", (req, res) => {
    const socket = net.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT)
    });

    socket.setTimeout(8000);

    socket.on("connect", () => {
        socket.destroy();
        res.json({ success: true, message: "Network connection successful" });
    });

    socket.on("timeout", () => {
        socket.destroy();
        res.status(504).json({ success: false, message: "Network connection timed out" });
    });

    socket.on("error", (err) => {
        socket.destroy();
        res.status(500).json({ success: false, message: err.code });
    });
});