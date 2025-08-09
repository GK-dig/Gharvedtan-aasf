document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS animations
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });

  // Profile dropdown functionality
  const profileIcon = document.getElementById('profileIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  if (profileIcon && dropdownMenu) {
    profileIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdownMenu.style.display = 'none';
    });
  }

  // Feedback editor functionality
  const editor = document.getElementById('comment');
  const toolBtns = document.querySelectorAll('.tool-btn');

  // Apply formatting on button click
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      editor.focus();
      document.execCommand(cmd, false, null);
      adjustEditorHeight();
      togglePlaceholder();
    });
  });

  // Auto-grow editor height
  function adjustEditorHeight() {
    editor.style.height = 'auto';
    editor.style.height = editor.scrollHeight + 'px';
  }

  // Placeholder toggle
  function togglePlaceholder() {
    const text = editor.textContent.replace(/\u200B/g, '').trim();
    if (!text) editor.classList.add('empty');
    else editor.classList.remove('empty');
  }

  // Update on input
  editor.addEventListener('input', () => {
    adjustEditorHeight();
    togglePlaceholder();
  });

  // Also update placeholder on focus/blur
  editor.addEventListener('focus', togglePlaceholder);
  editor.addEventListener('blur', togglePlaceholder);

  // Initialize on load
  adjustEditorHeight();
  togglePlaceholder();

  // Keyboard shortcuts for formatting
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
      setTimeout(() => {
        adjustEditorHeight();
        togglePlaceholder();
      }, 0);
    }
  });
});

// Submit feedback function with localStorage
function submitFeedback() {
  const editor = document.getElementById('comment');
  const html = editor.innerHTML;
  const text = editor.textContent.trim();
  
  if (!text) {
    alert('Please type your feedback before submitting.');
    return;
  }

  try {
    // Create feedback object with timestamp
    const feedback = {
      content: text,
      htmlContent: html,
      timestamp: new Date().toISOString()
    };

    // Get existing feedback or initialize empty array
    const existingFeedback = localStorage.getItem('gharvedtan_feedback');
    let allFeedback = existingFeedback ? JSON.parse(existingFeedback) : [];
    
    // Add new feedback
    allFeedback.push(feedback);
    
    // Save back to localStorage
    localStorage.setItem('gharvedtan_feedback', JSON.stringify(allFeedback));

    // Show success message
    alert('Thank you for your feedback! It has been saved.');
    
    // Reset editor
    editor.innerHTML = '';
    editor.style.height = 'auto';
    editor.classList.add('empty');

    // Debug: Log the stored data
    console.log('Stored feedback:', JSON.parse(localStorage.getItem('gharvedtan_feedback')));
  } catch (error) {
    console.error('Error saving feedback:', error);
    alert('There was an error saving your feedback. Please try again.');
  }
}

// Function to view stored feedback (for debugging)
function viewStoredFeedback() {
  const feedback = JSON.parse(localStorage.getItem('gharvedtan_feedback')) || [];
  console.log('All stored feedback:', feedback);
  return feedback;
}