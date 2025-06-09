// =========================== UI MANAGEMENT =========================== //

const UI = {
  // State management
  editingDirectoryId: null,
  editingDataId: null,
  currentDirectoryId: null,
  currentViewDirectoryId: null,
  currentColumns: [],
  currentPage: 1,
  pageSize: 100,
  searchTerm: '',

  // Message handling
  showMessage(text, type = 'success') {
      const container = document.getElementById('message-container');
      const message = document.createElement('div');
      message.className = `message ${type}`;
      message.textContent = text;
      container.appendChild(message);
      
      setTimeout(() => {
          if (message.parentNode) {
              message.remove();
          }
      }, 4000);
  },

  // Directory Modal Management
  openCreateModal() {
      this.editingDirectoryId = null;
      this.currentColumns = [];
      document.getElementById('modal-title').textContent = 'Create Directory';
      document.getElementById('submit-btn').textContent = 'Create Directory';
      document.getElementById('dir-title').value = '';
      document.getElementById('dir-description').value = '';
      this.updateColumnTags();
      document.getElementById('directory-modal').classList.add('show');
      document.getElementById('dir-title').focus();
  },

  openEditModal(id) {
      const directory = DataManager.getDirectory(id);
      if (!directory) return;
      
      this.editingDirectoryId = id;
      this.currentColumns = [...directory.columns];
      document.getElementById('modal-title').textContent = 'Edit Directory';
      document.getElementById('submit-btn').textContent = 'Update Directory';
      document.getElementById('dir-title').value = directory.title;
      document.getElementById('dir-description').value = directory.description || '';
      this.updateColumnTags();
      document.getElementById('directory-modal').classList.add('show');
      document.getElementById('dir-title').focus();
  },

  closeModal() {
      document.getElementById('directory-modal').classList.remove('show');
      document.getElementById('column-input').value = '';
  },

  // Data Modal Management
  openDataModal(directoryId, recordId = null) {
      const directory = DataManager.getDirectory(directoryId);
      if (!directory) return;
      
      this.currentDirectoryId = directoryId;
      this.editingDataId = recordId;
      
      document.getElementById('data-modal-title').textContent = 
          recordId ? 'Edit Record' : `Add Record to ${directory.title}`;
      document.getElementById('data-submit-btn').textContent = 
          recordId ? 'Update Record' : 'Add Record';
      
      this.generateDataForm(directory, recordId);
      document.getElementById('data-modal').classList.add('show');
      
      // Focus first input
      const firstInput = document.querySelector('#data-form-fields input');
      if (firstInput) firstInput.focus();
  },

  closeDataModal() {
      document.getElementById('data-modal').classList.remove('show');
      this.currentDirectoryId = null;
      this.editingDataId = null;
  },

  generateDataForm(directory, recordId = null) {
      const fieldsContainer = document.getElementById('data-form-fields');
      const existingRecord = recordId ? directory.data.find(d => d.id === recordId) : null;
      
      fieldsContainer.innerHTML = directory.columns.map(column => {
          const value = existingRecord ? existingRecord[column] || '' : '';
          return `
              <div class="form-group">
                  <label class="form-label" for="field_${column}">${column}</label>
                  <input type="text" id="field_${column}" name="${column}" 
                         class="form-input" placeholder="Enter ${column}..." value="${value}">
              </div>
          `;
      }).join('');
  },

  // Column Management
  addColumn() {
      const input = document.getElementById('column-input');
      const columnName = input.value.trim();
      
      if (!columnName) {
          this.showMessage('Please enter a column name.', 'error');
          return;
      }
      
      if (this.currentColumns.some(col => col.toLowerCase() === columnName.toLowerCase())) {
          this.showMessage('Column already exists!', 'error');
          return;
      }
      
      this.currentColumns.push(columnName);
      input.value = '';
      this.updateColumnTags();
  },

  removeColumn(index) {
      this.currentColumns.splice(index, 1);
      this.updateColumnTags();
  },

  updateColumnTags() {
      const container = document.getElementById('column-tags');
      container.innerHTML = this.currentColumns.map((column, index) => `
          <div class="column-tag">
              ${column}
              <button type="button" class="column-tag-remove" onclick="UI.removeColumn(${index})">×</button>
          </div>
      `).join('');
  },

  // Directory Display
  refreshDirectories() {
      const listContainer = document.getElementById('directory-list');
      const directories = DataManager.getAllDirectories();
      
      if (directories.length === 0) {
          listContainer.innerHTML = '<div class="empty-state">No directories found. Create one to get started!</div>';
          return;
      }
      
      listContainer.innerHTML = directories.map(dir => {
          const latestRecords = DataManager.getLatestRecords(dir.id, 3);
          
          return `
              <div class="card">
                  <div class="card-header">
                      <div>
                          <h3 class="card-title">📁 ${dir.title}</h3>
                          <p class="card-description">${dir.description || 'No description provided.'}</p>
                          <small style="color: hsl(var(--muted-foreground));">Created: ${dir.created.toLocaleDateString()}</small>
                      </div>
                      <div class="card-actions">
                          <button class="btn btn-primary btn-sm" onclick="UI.openDataModal(${dir.id})">Add Record</button>
                          <button class="btn btn-outline btn-sm" onclick="UI.openEditModal(${dir.id})">Edit</button>
                          <button class="btn btn-destructive btn-sm" onclick="UI.deleteDirectory(${dir.id})">Delete</button>
                      </div>
                  </div>
                  
                  <div class="card-content">
                      <div class="columns-section">
                          <div class="form-label">📊 Columns (${dir.columns.length})</div>
                          <div class="column-tags">
                              ${dir.columns.map(column => `
                                  <div class="badge badge-primary">${column}</div>
                              `).join('')}
                          </div>
                          ${dir.columns.length === 0 ? '<div style="color: hsl(var(--muted-foreground)); font-style: italic; margin-top: 0.5rem;">No columns defined</div>' : ''}
                      </div>
                      
                      <div class="data-section">
                          <div class="data-header">
                              <h4>📄 Recent Records <span class="record-count">${dir.data.length}</span></h4>
                              ${dir.data.length > 3 ? `<button class="btn btn-outline btn-sm" onclick="UI.showFullView(${dir.id})">View All Records</button>` : ''}
                          </div>
                          ${this.renderPreviewTable(dir, latestRecords)}
                      </div>
                  </div>
              </div>
          `;
      }).join('');
  },

  renderPreviewTable(directory, records) {
      if (records.length === 0) {
          return '<div class="no-data">No records found. Click "Add Record" to get started!</div>';
      }
      
      return `
          <div class="table-container">
              <table class="table">
                  <thead>
                      <tr>
                          ${directory.columns.map(column => `<th>${column}</th>`).join('')}
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${records.map(record => `
                          <tr>
                              ${directory.columns.map(column => `<td>${record[column] || '-'}</td>`).join('')}
                              <td>
                                  <button class="btn btn-outline btn-sm" onclick="UI.openDataModal(${directory.id}, ${record.id})">Edit</button>
                                  <button class="btn btn-destructive btn-sm" onclick="UI.deleteRecord(${directory.id}, ${record.id})">Delete</button>
                              </td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
      `;
  },

  // Full View Management
  showFullView(directoryId) {
      const directory = DataManager.getDirectory(directoryId);
      if (!directory) return;
      
      this.currentViewDirectoryId = directoryId;
      this.currentPage = 1;
      this.searchTerm = '';
      
      document.getElementById('full-view-directory-title').textContent = directory.title;
      document.getElementById('full-view-directory-description').textContent = directory.description || 'No description provided.';
      document.getElementById('search-input').value = '';
      
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('full-view').style.display = 'block';
      
      this.updateFullView();
  },

  showMainView() {
      document.getElementById('main-view').style.display = 'block';
      document.getElementById('full-view').style.display = 'none';
      this.currentViewDirectoryId = null;
  },

  updateFullView() {
      const directory = DataManager.getDirectory(this.currentViewDirectoryId);
      if (!directory) return;
      
      const filteredRecords = DataManager.searchRecords(this.currentViewDirectoryId, this.searchTerm);
      const paginationData = DataManager.paginateRecords(filteredRecords, this.currentPage, this.pageSize);
      
      this.renderFullTable(directory, paginationData.records);
      this.updatePaginationInfo(paginationData);
      this.renderPaginationControls(paginationData);
  },

  renderFullTable(directory, records) {
      const headerContainer = document.getElementById('full-table-header');
      const bodyContainer = document.getElementById('full-table-body');
      
      headerContainer.innerHTML = `
          <tr>
              ${directory.columns.map(column => `<th>${column}</th>`).join('')}
              <th>Actions</th>
          </tr>
      `;
      
      if (records.length === 0) {
          bodyContainer.innerHTML = `
              <tr>
                  <td colspan="${directory.columns.length + 1}" class="no-data">
                      ${this.searchTerm ? 'No records match your search.' : 'No records found.'}
                  </td>
              </tr>
          `;
          return;
      }
      
      bodyContainer.innerHTML = records.map(record => `
          <tr>
              ${directory.columns.map(column => `<td>${record[column] || '-'}</td>`).join('')}
              <td>
                  <button class="btn btn-outline btn-sm" onclick="UI.openDataModal(${directory.id}, ${record.id})">Edit</button>
                  <button class="btn btn-destructive btn-sm" onclick="UI.deleteRecord(${directory.id}, ${record.id})">Delete</button>
              </td>
          </tr>
      `).join('');
  },

  updatePaginationInfo(paginationData) {
      const infoElement = document.getElementById('pagination-text');
      if (paginationData.totalRecords === 0) {
          infoElement.textContent = 'No records found';
      } else {
          infoElement.textContent = `Showing ${paginationData.startIndex}-${paginationData.endIndex} of ${paginationData.totalRecords} records`;
      }
  },

  renderPaginationControls(paginationData) {
      const prevBtn = document.getElementById('prev-page');
      const nextBtn = document.getElementById('next-page');
      const pagesContainer = document.getElementById('pagination-pages');
      
      prevBtn.disabled = paginationData.currentPage === 1;
      nextBtn.disabled = paginationData.currentPage === paginationData.totalPages;
      
      // Generate page numbers (show max 7 pages)
      const maxVisiblePages = 7;
      let startPage = Math.max(1, paginationData.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(paginationData.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
          pages.push(`
              <button class="pagination-page ${i === paginationData.currentPage ? 'active' : ''}" 
                      onclick="UI.goToPage(${i})">${i}</button>
          `);
      }
      
      pagesContainer.innerHTML = pages.join('');
  },

  // Pagination and Search
  handleSearch() {
      this.searchTerm = document.getElementById('search-input').value;
      this.currentPage = 1; // Reset to first page when searching
      this.updateFullView();
  },

  goToPage(page) {
      this.currentPage = page;
      this.updateFullView();
  },

  goToPreviousPage() {
      if (this.currentPage > 1) {
          this.currentPage--;
          this.updateFullView();
      }
  },

  goToNextPage() {
      const directory = DataManager.getDirectory(this.currentViewDirectoryId);
      if (!directory) return;
      
      const filteredRecords = DataManager.searchRecords(this.currentViewDirectoryId, this.searchTerm);
      const totalPages = Math.ceil(filteredRecords.length / this.pageSize);
      
      if (this.currentPage < totalPages) {
          this.currentPage++;
          this.updateFullView();
      }
  },

  // CRUD Operations
  async handleDirectorySubmit(e) {
      e.preventDefault();
      
      const title = document.getElementById('dir-title').value.trim();
      const description = document.getElementById('dir-description').value.trim();
      
      if (!title) {
          this.showMessage('Please enter a directory title.', 'error');
          return;
      }
      
      try {
          if (this.editingDirectoryId) {
              DataManager.updateDirectory(this.editingDirectoryId, title, description, this.currentColumns);
              this.showMessage('Directory updated successfully!');
          } else {
              DataManager.createDirectory(title, description, this.currentColumns);
              this.showMessage('Directory created successfully!');
          }
          
          this.closeModal();
          this.refreshDirectories();
      } catch (error) {
          this.showMessage(error.message, 'error');
      }
  },

  async handleDataSubmit(e) {
      e.preventDefault();
      
      const directory = DataManager.getDirectory(this.currentDirectoryId);
      if (!directory) return;
      
      const formData = new FormData(e.target);
      const recordData = {};
      
      directory.columns.forEach(column => {
          recordData[column] = formData.get(column) || '';
      });
      
      try {
          if (this.editingDataId) {
              DataManager.updateRecord(this.currentDirectoryId, this.editingDataId, recordData);
              this.showMessage('Record updated successfully!');
          } else {
              DataManager.addRecord(this.currentDirectoryId, recordData);
              this.showMessage('Record added successfully!');
          }
          
          // Always update the full view first if we're on it
          if (this.currentViewDirectoryId === this.currentDirectoryId) {
              this.updateFullView();
          }
          
          this.closeDataModal();
          this.refreshDirectories();
      } catch (error) {
          this.showMessage(error.message, 'error');
      }
  },

  deleteDirectory(id) {
      const directory = DataManager.getDirectory(id);
      if (!directory) return;
      
      if (confirm(`Are you sure you want to delete "${directory.title}" and all its data?`)) {
          try {
              DataManager.deleteDirectory(id);
              this.showMessage(`Directory "${directory.title}" deleted successfully!`);
              this.refreshDirectories();
              
              // Return to main view if currently viewing this directory
              if (this.currentViewDirectoryId === id) {
                  this.showMainView();
              }
          } catch (error) {
              this.showMessage(error.message, 'error');
          }
      }
  },

  deleteRecord(directoryId, recordId) {
      if (confirm('Are you sure you want to delete this record?')) {
          try {
              DataManager.deleteRecord(directoryId, recordId);
              this.showMessage('Record deleted successfully!');
              this.refreshDirectories();
              
              // Update full view if currently viewing this directory
              if (this.currentViewDirectoryId === directoryId) {
                  this.updateFullView();
              }
          } catch (error) {
              this.showMessage(error.message, 'error');
          }
      }
  }
};