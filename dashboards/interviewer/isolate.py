import re

with open('dashboards/interviewer/interviewer.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const SESSION_KEY =', 'let SESSION_KEY =')
content = content.replace('const QUESTIONS_KEY =', 'let QUESTIONS_KEY =')
content = content.replace('const SCORECARDS_KEY =', 'let SCORECARDS_KEY =')
content = content.replace('const THEME_KEY =', 'let THEME_KEY =')
content = content.replace('const PROFILE_KEY =', 'let PROFILE_KEY =')

if "let LIVE_INTERVIEWS_KEY =" not in content:
    content = content.replace("let SESSION_KEY =", "let LIVE_INTERVIEWS_KEY = 'ekvueLiveInterviews';\nlet SESSION_KEY =")

content = content.replace("'ekvueLiveInterviews'", "LIVE_INTERVIEWS_KEY")

isolation_code = """
  // ISOLATE DATA PER USER
  const userPrefix = state.user.email ? '_' + state.user.email.replace(/[^a-zA-Z0-9]/g, '_') : '';
  SESSION_KEY = LS_KEYS.interviewerItems + userPrefix;
  QUESTIONS_KEY = 'ekvueInterviewerQuestions' + userPrefix;
  SCORECARDS_KEY = 'ekvueInterviewerScorecards' + userPrefix;
  PROFILE_KEY = 'ekvueInterviewerProfile' + userPrefix;
  THEME_KEY = 'ekvueSelectedTheme' + userPrefix;
  LIVE_INTERVIEWS_KEY = 'ekvueLiveInterviews' + userPrefix;
"""

if "// ISOLATE DATA PER USER" not in content:
    content = content.replace("  state.selectedTheme = localStorage.getItem(THEME_KEY) || 'default';", isolation_code + "\n  state.selectedTheme = localStorage.getItem(THEME_KEY) || 'default';")

with open('dashboards/interviewer/interviewer.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully applied data isolation logic!')
