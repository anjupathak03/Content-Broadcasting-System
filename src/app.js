const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const contentRoutes = require('./routes/contentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { publicLiveLimiter } = require('./middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use('/uploads', express.static(config.uploadAbsoluteDir));
app.use('/uploads', express.static(path.join(config.rootDir, 'uploads')));
app.use('/docs', express.static(path.join(config.rootDir, 'docs')));
app.use('/postman', express.static(path.join(config.rootDir, 'postman')));

app.use('/content/live', publicLiveLimiter, publicRoutes);
app.use('/api/content/live', publicLiveLimiter, publicRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
