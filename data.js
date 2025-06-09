// =========================== DATA MANAGEMENT =========================== //

const DataManager = {
  // Default data to use if localStorage is empty
  _defaultDirectories: [
      { 
          id: 1, 
          title: 'Client Database', 
          description: 'Example of a directory',
          columns: ['Name', 'Email', 'Phone', 'Company', 'Status'],
          data: [
              { id: 1, Name: 'John Smith', Email: 'john@example.com', Phone: '555-0123', Company: 'ABC Corp', Status: 'Active' },
              { id: 2, Name: 'Jane Doe', Email: 'jane@example.com', Phone: '555-0456', Company: 'XYZ Inc', Status: 'Pending' },
              { id: 3, Name: 'Bob Johnson', Email: 'bob@example.com', Phone: '555-0789', Company: 'Tech Solutions', Status: 'Active' },
              { id: 4, Name: 'Alice Brown', Email: 'alice@example.com', Phone: '555-0321', Company: 'Design Co', Status: 'Inactive' },
              { id: 5, Name: 'Charlie Wilson', Email: 'charlie@example.com', Phone: '555-0654', Company: 'Marketing Plus', Status: 'Active' }
          ],
          created: new Date('2024-03-05') 
      }
  ],
  
  // Storage that will be persisted
  directories: [],
  nextId: 1,
  nextDataId: 1,
  
  // Initialize from localStorage or default data
  init() {
    try {
      const savedData = localStorage.getItem('simpleDirectoriesData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Handle date objects which are stored as strings
        if (parsedData.directories && parsedData.directories.length > 0) {
          parsedData.directories.forEach(dir => {
            if (dir.created) {
              dir.created = new Date(dir.created);
            }
          });
          
          this.directories = parsedData.directories;
          this.nextId = parsedData.nextId || this.directories.length + 1;
          this.nextDataId = parsedData.nextDataId || 1;
          
          console.log('Data loaded from localStorage');
          return;
        }
      }
      
      // If no data in localStorage or parsing failed, use default data
      this.directories = JSON.parse(JSON.stringify(this._defaultDirectories));
      this.nextId = 2;
      this.nextDataId = 6;
      console.log('Using default data');
      // Save default data to localStorage on first run
      this.saveToLocalStorage();
      
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.directories = JSON.parse(JSON.stringify(this._defaultDirectories));
      this.nextId = 2;
      this.nextDataId = 6;
      this.saveToLocalStorage();
    }
  },
  
  // Save current state to localStorage
  saveToLocalStorage() {
    try {
      const dataToSave = {
        directories: this.directories,
        nextId: this.nextId,
        nextDataId: this.nextDataId
      };
      
      localStorage.setItem('simpleDirectoriesData', JSON.stringify(dataToSave));
      console.log('Data saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  // Clear all data and reset to defaults
  resetData() {
    this.directories = JSON.parse(JSON.stringify(this._defaultDirectories));
    this.nextId = 2;
    this.nextDataId = 6;
    this.saveToLocalStorage();
    return this.directories;
  },

  // Directory CRUD operations
  createDirectory(title, description, columns) {
      if (this.directories.some(dir => dir.title.toLowerCase() === title.toLowerCase())) {
          throw new Error('Directory title already exists!');
      }
      
      const newDirectory = {
          id: this.nextId++,
          title: title,
          description: description,
          columns: [...columns],
          data: [],
          created: new Date()
      };
      
      this.directories.push(newDirectory);
      this.saveToLocalStorage();
      return newDirectory;
  },

  updateDirectory(id, title, description, columns) {
      const existingDir = this.directories.find(dir => 
          dir.id !== id && dir.title.toLowerCase() === title.toLowerCase()
      );
      
      if (existingDir) {
          throw new Error('Directory title already exists!');
      }
      
      const directory = this.directories.find(dir => dir.id === id);
      if (!directory) {
          throw new Error('Directory not found!');
      }
      
      directory.title = title;
      directory.description = description;
      directory.columns = [...columns];
      this.saveToLocalStorage();
      return directory;
  },

  deleteDirectory(id) {
      const index = this.directories.findIndex(dir => dir.id === id);
      if (index === -1) {
          throw new Error('Directory not found!');
      }
      
      const deleted = this.directories.splice(index, 1)[0];
      this.saveToLocalStorage();
      return deleted;
  },

  getDirectory(id) {
      return this.directories.find(dir => dir.id === id);
  },

  getAllDirectories() {
      return this.directories;
  },

  // Data record CRUD operations
  addRecord(directoryId, recordData) {
      const directory = this.getDirectory(directoryId);
      if (!directory) {
          throw new Error('Directory not found!');
      }
      
      const newRecord = {
          id: this.nextDataId++,
          ...recordData
      };
      
      directory.data.push(newRecord);
      this.saveToLocalStorage();
      return newRecord;
  },

  updateRecord(directoryId, recordId, recordData) {
      const directory = this.getDirectory(directoryId);
      if (!directory) {
          throw new Error('Directory not found!');
      }
      
      const recordIndex = directory.data.findIndex(record => record.id === recordId);
      if (recordIndex === -1) {
          throw new Error('Record not found!');
      }
      
      directory.data[recordIndex] = {
          id: recordId,
          ...recordData
      };
      
      this.saveToLocalStorage();
      return directory.data[recordIndex];
  },

  deleteRecord(directoryId, recordId) {
      const directory = this.getDirectory(directoryId);
      if (!directory) {
          throw new Error('Directory not found!');
      }
      
      const recordIndex = directory.data.findIndex(record => record.id === recordId);
      if (recordIndex === -1) {
          throw new Error('Record not found!');
      }
      
      const deleted = directory.data.splice(recordIndex, 1)[0];
      this.saveToLocalStorage();
      return deleted;
  },

  // Search and pagination helpers
  searchRecords(directoryId, searchTerm) {
      const directory = this.getDirectory(directoryId);
      if (!directory) {
          return [];
      }
      
      if (!searchTerm.trim()) {
          return directory.data;
      }
      
      const term = searchTerm.toLowerCase();
      return directory.data.filter(record => 
          directory.columns.some(column => {
              const value = record[column];
              return value && value.toString().toLowerCase().includes(term);
          })
      );
  },

  paginateRecords(records, page, pageSize) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRecords = records.slice(startIndex, endIndex);
      
      return {
          records: paginatedRecords,
          totalRecords: records.length,
          totalPages: Math.ceil(records.length / pageSize),
          currentPage: page,
          pageSize: pageSize,
          startIndex: startIndex + 1,
          endIndex: Math.min(endIndex, records.length)
      };
  },

  getLatestRecords(directoryId, limit = 3) {
      const directory = this.getDirectory(directoryId);
      if (!directory) {
          return [];
      }
      
      // Sort by ID descending (latest first) and take the limit
      return [...directory.data]
          .sort((a, b) => b.id - a.id)
          .slice(0, limit);
  }
};