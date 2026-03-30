// ExtendScript ES3 — NIE używaj const/let/async/arrow functions

function getCurrentTimecode() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "00:00:00:00";
    return seq.getPlayerPosition().getFormatted(app.project.activeSequence.getSettings().videoFrameRate, app.project.activeSequence.videoDisplayFormat);
  } catch (e) { return "00:00:00:00"; }
}

function getProjectName() {
  try { return app.project.name.replace(/\.prproj$/, ""); }
  catch (e) { return ""; }
}

function getSequenceName() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "";
    return seq.name;
  } catch (e) { return ""; }
}

function getProjectPath() {
  try { return app.project.path; }
  catch (e) { return ""; }
}

function getPremiereContext() {
  try {
    var result = {
      projectName: getProjectName(),
      sequenceName: getSequenceName(),
      timecode: getCurrentTimecode(),
      projectPath: getProjectPath()
    };
    return JSON.stringify(result);
  } catch (e) {
    return '{"error": "' + e.toString() + '"}';
  }
}
