// =========================== APPLICATION INITIALIZATION =========================== //

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the data from localStorage
  DataManager.init();
  
  // Initialize the application
  UI.refreshDirectories();
  
  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Directory form submission
  document.getElementById('directory-form').addEventListener('submit', UI.handleDirectorySubmit.bind(UI));
  
  // Data form submission
  document.getElementById('data-form').addEventListener('submit', UI.handleDataSubmit.bind(UI));
  
  // Column input - Enter key support
  document.getElementById('column-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          e.preventDefault();
          UI.addColumn();
      }
  });
  
  // Search input - debounced search
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
          UI.handleSearch();
      }, 300);
  });
  
  // Modal close when clicking outside
  document.getElementById('directory-modal').addEventListener('click', function(e) {
      if (e.target === this) {
          UI.closeModal();
      }
  });
  
  document.getElementById('data-modal').addEventListener('click', function(e) {
      if (e.target === this) {
          UI.closeDataModal();
      }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
      // ESC key to close modals
      if (e.key === 'Escape') {
          const directoryModal = document.getElementById('directory-modal');
          const dataModal = document.getElementById('data-modal');
          
          if (directoryModal.classList.contains('show')) {
              UI.closeModal();
          } else if (dataModal.classList.contains('show')) {
              UI.closeDataModal();
          }
      }
      
      // Ctrl/Cmd + N to create new directory
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
          e.preventDefault();
          if (document.getElementById('main-view').style.display !== 'none') {
              UI.openCreateModal();
          }
      }
      
      // Ctrl/Cmd + F to focus search (when in full view)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          const searchInput = document.getElementById('search-input');
          if (document.getElementById('full-view').style.display !== 'none') {
              e.preventDefault();
              searchInput.focus();
              searchInput.select();
          }
      }
  });
}

// =========================== UTILITY FUNCTIONS =========================== //

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}

// Format date helper
function formatDate(date) {
  if (!(date instanceof Date)) {
      date = new Date(date);
  }
  return date.toLocaleDateString();
}

// Format file size helper
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate email helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input helper
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// =========================== EXPORT FOR TESTING =========================== //

// Export objects for potential testing or external access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
      DataManager,
      UI,
      formatDate,
      formatFileSize,
      isValidEmail,
      sanitizeInput
  };
}

// =========================== DEVELOPMENT HELPERS =========================== //

// Add some development helpers when not in production
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Add console helpers
  window.DataManager = DataManager;
  window.UI = UI;
  
  // Add sample data generator
  window.generateSampleData = function(directoryId, count = 10) {
      const directory = DataManager.getDirectory(directoryId);
      if (!directory) {
          console.error('Directory not found');
          return;
      }
      
      for (let i = 0; i < count; i++) {
          const recordData = {};
          directory.columns.forEach(column => {
              recordData[column] = `Sample ${column} ${i + 1}`;
          });
          DataManager.addRecord(directoryId, recordData);
      }
      
      UI.refreshDirectories();
      if (UI.currentViewDirectoryId === directoryId) {
          UI.updateFullView();
      }
      
      console.log(`Generated ${count} sample records for directory: ${directory.title}`);
  };
  
  // Add data export helper
  window.exportData = function() {
      const data = {
          directories: DataManager.getAllDirectories(),
          exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'directory-manager-data.json';
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('Data exported successfully');
  };
  
  // Add reset data helper
  window.resetData = function() {
    if (confirm('Are you sure you want to reset all data to default? This cannot be undone.')) {
      DataManager.resetData();
      UI.refreshDirectories();
      console.log('Data reset to default');
    }
  };
  
  console.log('🚀 Development mode detected');
  console.log('Available helpers:');
  console.log('- DataManager: Access data management functions');
  console.log('- UI: Access UI management functions');
  console.log('- generateSampleData(directoryId, count): Generate sample records');
  console.log('- exportData(): Export all data as JSON');
  console.log('- resetData(): Reset all data to default');
}