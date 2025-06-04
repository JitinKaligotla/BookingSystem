const validateBody = (schema, redirectPath) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const msg = error.details.map(el => el.message).join(", ");
      req.flash('error', msg);
      return res.redirect(redirectPath);  // Redirect explicitly to the form page
    }
    next();
  };
};

module.exports = validateBody;
