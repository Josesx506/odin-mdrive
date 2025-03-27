document.addEventListener('DOMContentLoaded', function() {
    const alertPopup = document.getElementById('alertPopup');
    
    if (alertPopup) {
      // Show the alert
      setTimeout(() => alertPopup.classList.add('show'), 100);
      
      // Hide pop up alert after 2 seconds
      setTimeout(() => {
        alertPopup.classList.remove('show');
        setTimeout(() => alertPopup.remove(), 500);
      }, 2000);
    }
});