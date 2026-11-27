require('dotenv').config();
const app = require('./app');
const connectToDatabase = require('./config/db');

async function startServer() {
  try {
    await connectToDatabase();

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
