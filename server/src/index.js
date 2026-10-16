require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
if (require.main === module) app.listen(port, () => console.log(`POS API listening on :${port}`));
module.exports = app;
