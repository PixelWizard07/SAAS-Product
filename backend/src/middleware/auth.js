const { verify } = require('../utils/jwt');

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = verify(header.slice(7));
    next();
  } catch (err) {
    const status = err.name === 'TokenExpiredError' ? 401 : 403;
    res.status(status).json({ error: err.message });
  }
};

module.exports = auth;
