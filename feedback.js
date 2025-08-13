document.addEventListener('DOMContentLoaded', function() {

  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });

  const profileIcon = document.getElementById('profileIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  if (profileIcon && dropdownMenu) {
    profileIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function() {
      dropdownMenu.style.display = 'none';
    });
  }


  const editor = document.getElementById('comment');
  const toolBtns = document.querySelectorAll('.tool-btn');

  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      editor.focus();
      document.execCommand(cmd, false, null);
      adjustEditorHeight();
      togglePlaceholder();
    });
  });


  function adjustEditorHeight() {
    editor.style.height = 'auto';
    editor.style.height = editor.scrollHeight + 'px';
  }

  function togglePlaceholder() {
    const text = editor.textContent.replace(/\u200B/g, '').trim();
    if (!text) editor.classList.add('empty');
    else editor.classList.remove('empty');
  }

  editor.addEventListener('input', () => {
    adjustEditorHeight();
    togglePlaceholder();
  });

  editor.addEventListener('focus', togglePlaceholder);
  editor.addEventListener('blur', togglePlaceholder);

 
  adjustEditorHeight();
  togglePlaceholder();

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
      setTimeout(() => {
        adjustEditorHeight();
        togglePlaceholder();
      }, 0);
    }
  });
});

function submitFeedback() {
  const editor = document.getElementById('comment');
  const html = editor.innerHTML;
  const text = editor.textContent.trim();
  
  if (!text) {
    alert('Please type your feedback before submitting.');
    return;
  }

  try {
    
    const feedback = {
      content: text,
      htmlContent: html,
      timestamp: new Date().toISOString()
    };

    const existingFeedback = localStorage.getItem('gharvedtan_feedback');
    let allFeedback = existingFeedback ? JSON.parse(existingFeedback) : [];
    
    allFeedback.push(feedback);
    
   
    localStorage.setItem('gharvedtan_feedback', JSON.stringify(allFeedback));


    alert('Thank you for your feedback! It has been saved.');
    
 
    editor.innerHTML = '';
    editor.style.height = 'auto';
    editor.classList.add('empty');

    console.log('Stored feedback:', JSON.parse(localStorage.getItem('gharvedtan_feedback')));
  } catch (error) {
    console.error('Error saving feedback:', error);
    alert('There was an error saving your feedback. Please try again.');
  }
}


function viewStoredFeedback() {
  const feedback = JSON.parse(localStorage.getItem('gharvedtan_feedback')) || [];
  console.log('All stored feedback:', feedback);
  return feedback;
}