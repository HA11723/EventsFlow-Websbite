export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/signin');
  }
  next();
}