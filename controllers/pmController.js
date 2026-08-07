// The shared /projects and /tasks routes already scope results by role
// (see projectController.scopeFilter). These routes simply give the
// Project Manager portal its own nav entry point into that same data.
exports.myProjects = (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  res.redirect(`/projects${qs ? `?${qs}` : ''}`);
};
