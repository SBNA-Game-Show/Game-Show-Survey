/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Primary colours */
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        "primary-light": "var(--primary-light)",
        "primary-lighter": "var(--primary-lighter)",

        /* Secondary colours */
        secondary: "var(--secondary)",
        "secondary-dark": "var(--secondary-dark)",
        "secondary-light": "var(--secondary-light)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",

        /* Survey Layout */
        "survey-bg": "var(--survey-bg)",

        /* Header */
        "header-bg": "var(--header-bg)",
        "header-primary": "var(--header-primary)",
        "header-subtitle": "var(--header-subtitle)",
        "header-accent": "var(--header-accent)",

        /* Header buttons */
        "btn-active-text": "var(--btn-active-text)",
        "btn-inactive-text": "var(--btn-inactive-text)",
        "btn-inactive-hover-bg": "var(--btn-inactive-hover-bg)",
        "btn-inactive-hover-border": "var(--btn-inactive-hover-border)",

        "btn-analytics-bg": "var(--btn-analytics-bg)",
        "btn-analytics-text": "var(--btn-analytics-text)",
        "btn-analytics-hover-bg": "var(--btn-analytics-hover-bg)",
        "btn-analytics-hover-border": "var(--btn-analytics-hover-border)",

        "btn-ranking-bg": "var(--btn-ranking-bg)",
        "btn-ranking-text": "var(--btn-ranking-text)",
        "btn-ranking-hover-bg": "var(--btn-ranking-hover-bg)",
        "btn-ranking-hover-border": "var(--btn-ranking-hover-border)",

        "btn-preview-bg": "var(--btn-preview-bg)",
        "btn-preview-text": "var(--btn-preview-text)",
        "btn-preview-hover-bg": "var(--btn-preview-hover-bg)",
        "btn-preview-hover-border": "var(--btn-preview-hover-border)",

        "btn-save-questions-bg": "var(--btn-save-questions-bg)",
        "btn-save-questions-text": "var(--btn-save-questions-text)",
        "btn-save-questions-hover-bg": "var(--btn-save-questions-hover-bg)",

        "btn-save-changes-bg": "var(--btn-save-changes-bg)",
        "btn-save-changes-text": "var(--btn-save-changes-text)",
        "btn-save-changes-hover-bg": "var(--btn-save-changes-hover-bg)",

        "btn-logout-bg": "var(--btn-logout-bg)",
        "btn-logout-text": "var(--btn-logout-text)",
        "btn-logout-hover-bg": "var(--btn-logout-hover-bg)",
        "btn-logout-hover-border": "var(--btn-logout-hover-border)",

        /* Question Card */
        "question-card-bg": "var(--question-card-bg)",
        "question-card-text": "var(--question-card-text)",
        "btn-next-bg": "var(--btn-next-bg)",
        "btn-next-text": "var(--btn-next-text)",
        "btn-next-hover-bg": "var(--btn-next-hover-bg)",
        "btn-delete-question-bg": "var(--btn-delete-question-bg)",
        "btn-delete-question-text": "var(--btn-delete-question-text)",
        "btn-delete-question-hover-bg": "var(--btn-delete-question-hover-bg)",
        "btn-delete-question-hover-text":
          "var(--btn-delete-question-hover-text)",

        /* Sidebar */
        "sidebar-bg": "var(--sidebar-bg)",
        "sidebar-text": "var(--sidebar-text)",
        "active-level-tab-bg": "var(--active-level-tab-bg)",
        "active-level-tab-text": "var(--active-level-tab-text)",
        "inactive-level-tab-bg": "var(--inactive-level-tab-bg)",
        "inactive-level-tab-text": "var(--inactive-level-tab-text)",
        "progress-text": "var(--progress-text)",
        "progress-number": "var(--progress-number)",
        "progress-bar-from": "var(--progress-bar-from)",
        "progress-bar-to": "var(--progress-bar-to)",
        "levelquestion-active-bg": "var(--levelquestion-active-bg)",
        "levelquestion-active-border": "var(--levelquestion-active-border)",
        "btn-delete-all-questions-bg": "var(--btn-delete-all-questions-bg)",
        "btn-delete-all-questions-text": "var(--btn-delete-all-questions-text)",
        "btn-delete-all-questions-hover-bg":
          "var(--btn-delete-all-questions-hover-bg)",
        "question-bank-text": "var(--question-bank-text)",

        /* Login */
        "login-bg": "var(--login-bg)",
        "login-card-bg": "var(--login-card-bg)",
        "login-active-text": "var(--login-active-text)",
        "login-nonactive-text": "var(--login-nonactive-text)",
        "login-nonactive-bg": "var(--login-nonactive-bg)",
        "login-primary": "var(--login-primary)",
        "login-input-border": "var(--login-input-border)",
        "login-checkbox-border": "var(--login-checkbox-border)",
        "login-focus-border": "var(--login-focus-border)",
        "login-checkbox-text": "var(--login-checkbox-text)",
        "login-button-bg": "var(--login-button-bg)",
        "login-button-hover": "var(--login-button-hover)",
        "login-button-text": "var(--login-button-text)",
        "login-error-text": "var(--login-error-text)",
        "login-error-bg": "var(--login-error-bg)",
        "login-error-border": "var(--login-error-border)",
        "login-welcome-text": "var(--login-welcome-text)",

        /* Proficiency modal */
        "proficiency-bg": "var(--proficiency-bg)",
        "proficiency-card-bg": "var(--proficiency-card-bg)",
        "proficiency-primary": "var(--proficiency-primary)",
        "proficiency-active-text": "var(--proficiency-active-text)",
        "proficiency-level-text": "var(--proficiency-level-text)",
        "proficiency-hover": "var(--proficiency-hover)",
        "proficiency-confirm-bg": "var(--proficiency-confirm-bg)",
        "proficiency-confirm-text": "var(--proficiency-confirm-text)",

        /* Not Found */
        "notfound-bg": "var(--notfound-bg)",
        "notfound-primary": "var(--notfound-primary)",
        "notfound-hover": "var(--notfound-hover)",
        "notfound-text": "var(--notfound-text)",
        "notfound-button-text": "var(--notfound-button-text)",

        /* Logout Prompt */
        "logout-bg": "#1a202c84",
        "logout-card-bg": "var(--logout-card-bg)",
        "logout-primary": "var(--logout-primary)",
        "logout-hover": "var(--logout-hover)",
        "logout-text": "var(--logout-text)",
        "logout-button-text": "var(--logout-button-text)",
        "logout-cancel-text": "var(--logout-cancel-text)",
        "logout-cancel-bg": "var(--logout-cancel-bg)",
        "logout-cancel-hover": "var(--logout-cancel-hover)",

        /* Update Survey */
        "update-bg": "#1a202c83",
        "update-card-bg": "var(--update-card-bg)",
        "update-primary": "var(--update-primary)",
        "update-text": "var(--update-text)",
        "update-button-bg": "var(--update-button-bg)",
        "update-button-hover": "var(--update-button-hover)",
        "update-button-text": "var(--update-button-text)",
        "update-cancel-bg": "var(--update-cancel-bg)",
        "update-cancel-hover": "var(--update-cancel-hover)",
        "update-cancel-text": "var(--update-cancel-text)",

        /* Analytics */
        "analytics-bg": "var(--analytics-bg)",
        "button-refresh-responses-back": "var(--button-refresh-responses-back)",
        "responses-bg": "var(--responses-bg)",
        "question-details": "var(--questiondetails-bg)",


        /* Admin lost connection */
        "adminlost-bg": "var(--adminlost-bg)",
        "adminlost-connection-issue": "var(--adminlost-connection-issue)",
        "adminlost-card-bg": "var(--adminlost-card-bg)",
        "adminlost-icon": "var(--adminlost-icon)",
        "adminlost-icon-bg": "var(--adminlost-icon-bg)",
        "adminlost-beginner-bg": "var(--adminlost-beginner-bg)",
        "adminlost-intermediate-bg": "var(--adminlost-intermediate-bg)",
        "adminlost-advanced-bg": "var(--adminlost-advanced-bg)",

        /* Error Alert */
        "error-bg": "var(--error-bg)",
        "error-border": "var(--error-border)",
        "error-text": "var(--error-text)",
        "error-dismiss-text": "var(--error-dismiss-text)",
        "error-dismiss-hover": "var(--error-dismiss-hover)",

        /* User QuestionCard colors */
        'user-card-bg': 'var(--user-card-bg)',
        'user-card-border': 'var(--user-card-border)',
        
        'user-logout-color': 'var(--user-logout-color)',
        'user-logout-hover': 'var(--user-logout-hover)',
        
        'user-textarea-border': 'var(--user-textarea-border)',
        'user-textarea-focus': 'var(--user-textarea-focus)',
        'user-textarea-bg': 'var(--user-textarea-bg)',
        'user-textarea-recording-bg': 'var(--user-textarea-recording-bg)',
        'user-textarea-recording-border': 'var(--user-textarea-recording-border)',
        
        'user-btn-speak-from': 'var(--user-btn-speak-from)',
        'user-btn-speak-to': 'var(--user-btn-speak-to)',
        'user-btn-speak-hover-from': 'var(--user-btn-speak-hover-from)',
        'user-btn-speak-hover-to': 'var(--user-btn-speak-hover-to)',
        
        'user-btn-save-from': 'var(--user-btn-save-from)',
        'user-btn-save-to': 'var(--user-btn-save-to)',
        'user-btn-save-hover-from': 'var(--user-btn-save-hover-from)',
        'user-btn-save-hover-to': 'var(--user-btn-save-hover-to)',
        
        'user-btn-skip-bg': 'var(--user-btn-skip-bg)',
        'user-btn-skip-text': 'var(--user-btn-skip-text)',
        'user-btn-skip-hover': 'var(--user-btn-skip-hover)',
        'user-btn-skip-active-bg': 'var(--user-btn-skip-active-bg)',
        'user-btn-skip-active-text': 'var(--user-btn-skip-active-text)',
        'user-btn-skip-active-hover': 'var(--user-btn-skip-active-hover)',
        
        'user-tts-play-bg': 'var(--user-tts-play-bg)',
        'user-tts-play-hover': 'var(--user-tts-play-hover)',
        'user-tts-stop-bg': 'var(--user-tts-stop-bg)',
        'user-tts-stop-hover': 'var(--user-tts-stop-hover)',
        'user-tts-loading-bg': 'var(--user-tts-loading-bg)',
        
        'user-preview-border': 'var(--user-preview-border)',
        'user-preview-title': 'var(--user-preview-title)',
        'user-preview-submit-from': 'var(--user-preview-submit-from)',
        'user-preview-submit-to': 'var(--user-preview-submit-to)',
        
        'user-recording-indicator': 'var(--user-recording-indicator)',
        'user-transcribing-bg': 'var(--user-transcribing-bg)',
        'user-transcribing-text': 'var(--user-transcribing-text)',
        'user-transcribing-border': 'var(--user-transcribing-border)',

        /* User Survey Page Colors */
        'user-survey-bg': 'var(--user-survey-bg)',
        'user-survey-loading-spinner-border': 'var(--user-survey-loading-spinner-border)',
        'user-survey-loading-spinner-top': 'var(--user-survey-loading-spinner-top)',
        'user-survey-loading-text': 'var(--user-survey-loading-text)',
        'user-survey-no-questions-bg': 'var(--user-survey-no-questions-bg)',
        'user-survey-no-questions-icon-bg': 'var(--user-survey-no-questions-icon-bg)',
        'user-survey-no-questions-icon': 'var(--user-survey-no-questions-icon)',
        'user-survey-no-questions-text': 'var(--user-survey-no-questions-text)',
        'user-survey-no-questions-subtext': 'var(--user-survey-no-questions-subtext)',
        'user-survey-btn-back-bg': 'var(--user-survey-btn-back-bg)',
        'user-survey-btn-back-hover': 'var(--user-survey-btn-back-hover)',
        'user-survey-menu-toggle-bg': 'var(--user-survey-menu-toggle-bg)',
        'user-survey-menu-toggle-icon': 'var(--user-survey-menu-toggle-icon)',
        'user-survey-popup-success-bg': 'var(--user-survey-popup-success-bg)',
        'user-survey-popup-success-icon': 'var(--user-survey-popup-success-icon)',
        'user-survey-popup-error-bg': 'var(--user-survey-popup-error-bg)',
        'user-survey-popup-error-icon': 'var(--user-survey-popup-error-icon)',
        'user-survey-popup-title-success': 'var(--user-survey-popup-title-success)',
        'user-survey-popup-title-error': 'var(--user-survey-popup-title-error)',
        'user-survey-popup-text': 'var(--user-survey-popup-text)',
        'user-survey-btn-ok-success': 'var(--user-survey-btn-ok-success)',
        'user-survey-btn-ok-success-hover': 'var(--user-survey-btn-ok-success-hover)',
        'user-survey-btn-ok-error': 'var(--user-survey-btn-ok-error)',
        'user-survey-btn-ok-error-hover': 'var(--user-survey-btn-ok-error-hover)',

        //Sidebar Colors
        'sb-bg': 'var(--sb-bg)',
        'sb-border': 'var(--sb-border)',
        'sb-text': 'var(--sb-text)',
        'sb-active-bg': 'var(--sb-active-bg)',
        'sb-active-border': 'var(--sb-active-border)',
        'sb-hover-bg': 'var(--sb-hover-bg)',
        'sb-progress-bar-from': 'var(--sb-progress-bar-from)',
        'sb-progress-bar-to': 'var(--sb-progress-bar-to)',
        'sb-progress-text': 'var(--sb-progress-text)',
        'sb-indicator-active': 'var(--sb-indicator-active)',
        'sb-indicator-skip': 'var(--sb-indicator-skip)',
        'sb-indicator-border': 'var(--sb-indicator-border)',
      },

      fontFamily: {
        samarkan: ['"Samarkan Normal V2"', "cursive"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        devanagari: [
          "Noto Sans Devanagari",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
