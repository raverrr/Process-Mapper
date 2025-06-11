function exportMap() {
    const title = document.getElementById('map-title').value || 'Untitled Map';
    const nodes = [];
    document.querySelectorAll('.node-container').forEach(container => {
      const id = container.id;
      const node = container.querySelector('.node');
      const type = getNodeType(node);
      const name = node.textContent || node.querySelector('div')?.textContent || '';
      const left = parseFloat(container.style.left) || 0;
      const top = parseFloat(container.style.top) || 0;
      const height = parseFloat(container.style.height) || getNodeHeight(type);
      const { notes, owners } = nodeData[id] || { notes: '', owners: '' };
      nodes.push({ id, type, name, left, top, height, notes, owners });
    });
  
    const connectors = connections.map(conn => {
      const startNodeId = conn.startNode.id;
      const endNodeId = conn.endNode.id;
      const pathType = conn.config.path;
      const label = conn.config.label || '';
      return { startNodeId, endNodeId, pathType, label };
    });
  
    const swimlanes = [];
    document.querySelectorAll('.swimlane').forEach(swimlane => {
      const id = swimlane.id;
      const label = swimlane.querySelector('.swimlane-label').textContent;
      const colorClass = Array.from(swimlane.classList).find(cls => cls.startsWith('swimlane-color-'));
      const color = colorClass ? colorClass.replace('swimlane-color-', '') : 'gray';
      const top = parseFloat(swimlane.style.top) || 0;
      const height = parseFloat(swimlane.style.height) || 100;
      swimlanes.push({ id, label, color, top, height });
    });
  
    const vsmContainers = [];
    document.querySelectorAll('.vsm-container').forEach((container, index) => {
      const id = container.id || `vsm${index}`; // Ensure unique ID
      container.id = id; // Assign ID to DOM element for consistency
      const left = parseFloat(container.style.left) || 0;
      const top = parseFloat(container.style.top) || 0;
      const width = parseFloat(container.style.width) || 300;
      const height = parseFloat(container.style.height) || 200;
      const leadTime = parseFloat(container.querySelector('.lead-time')?.value) || 0;
      const processTime = parseFloat(container.querySelector('.process-time')?.value) || 0;
      const percentCA = parseFloat(container.querySelector('.percent-ca')?.value) || 100;
      vsmContainers.push({ id, left, top, width, height, leadTime, processTime, percentCA });
    });
  
    const mapData = { title, nodes, connectors, swimlanes, vsmContainers };
    const json = JSON.stringify(mapData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = title.replace(/\s+/g, '_') + '.json';
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function importMap(mapData) {
    // Remove all existing connections
    connections.forEach(conn => conn.line.remove());
    connections = [];
    // Clear node data
    nodeData = {};
    // Clear the canvas completely
    canvas.innerHTML = '';
  
    // Recreate grid background and guideline
    const gridBackground = document.createElement('div');
    gridBackground.className = 'grid-background';
    canvas.appendChild(gridBackground);
  
    const guideline = document.createElement('div');
    guideline.className = 'guideline';
    canvas.appendChild(guideline);
  
    document.getElementById('map-title').value = mapData.title || 'Untitled Map';
    updateDocumentTitle();
  
    mapData.swimlanes.forEach(swimlaneData => {
      const swimlane = document.createElement('div');
      swimlane.id = swimlaneData.id;
      swimlane.className = `swimlane swimlane-color-${swimlaneData.color}`;
      swimlane.innerHTML = `<span class="swimlane-label">${swimlaneData.label}</span><div class="swimlane-resize-handle"></div>`;
      swimlane.style.top = `${swimlaneData.top}px`;
      swimlane.style.height = `${swimlaneData.height}px`;
      canvas.appendChild(swimlane);
    });
  
    mapData.nodes.forEach(nodeDataItem => {
      const container = document.createElement('div');
      container.className = 'node-container';
      container.id = nodeDataItem.id;
      container.style.left = `${nodeDataItem.left}px`;
      container.style.top = `${nodeDataItem.top}px`;
      container.style.height = `${nodeDataItem.height}px`;
      const node = document.createElement('div');
      node.className = `node ${nodeDataItem.type}`;
      if (nodeDataItem.type === 'decision' || nodeDataItem.type === 'input-output') {
        node.innerHTML = `<div>${nodeDataItem.name}</div>`;
      } else {
        node.textContent = nodeDataItem.name;
      }
      container.appendChild(node);
      canvas.appendChild(container);
      nodeData[container.id] = { notes: nodeDataItem.notes, owners: nodeDataItem.owners };
    });
  
    mapData.connectors.forEach(connectorData => {
      const startNodeContainer = document.getElementById(connectorData.startNodeId);
      const endNodeContainer = document.getElementById(connectorData.endNodeId);
      if (startNodeContainer && endNodeContainer) {
        const startNodeEl = startNodeContainer.querySelector('.node');
        const endNodeEl = endNodeContainer.querySelector('.node');
        const lineOptions = {
          path: connectorData.pathType,
          endPlug: 'arrow1',
          color: '#E0E0E0',
          size: 2,
          dash: connectorData.pathType === 'dash' ? { animation: true } : false,
          ...(connectorData.label && { middleLabel: LeaderLine.captionLabel(connectorData.label, { color: '#333' }) }),
          startSocket: 'auto',
          endSocket: 'auto',
          parent: canvas
        };
        const line = new LeaderLine(startNodeEl, endNodeEl, lineOptions);
        connections.push({ line, config: { path: connectorData.pathType, label: connectorData.label }, startNode: startNodeContainer, endNode: endNodeContainer });
      }
    });
  
    // Clear existing VSM containers
    vsmTables = [];
    document.querySelectorAll('.vsm-container').forEach(container => container.remove());
  
    // Recreate VSM containers
    mapData.vsmContainers?.forEach((vsmData, index) => {
      const container = document.createElement('div');
      container.className = 'vsm-container';
      container.id = vsmData.id || `vsm${index}`; // Ensure unique ID
      container.style.left = `${vsmData.left}px`;
      container.style.top = `${vsmData.top}px`;
      container.style.width = `${vsmData.width}px`;
      container.style.height = `${vsmData.height}px`;

      // Create drag handle
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      container.appendChild(dragHandle);

      // Add drag functionality
      dragHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = parseFloat(container.style.left) || container.offsetLeft;
        const startTop = parseFloat(container.style.top) || container.offsetTop;

        function onMouseMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          container.style.left = (startLeft + dx) + 'px';
          container.style.top = (startTop + dy) + 'px';
        }

        function onMouseUp() {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      // Create resize handles
      const positions = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
      positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        container.appendChild(handle);

        handle.addEventListener('mousedown', function(e) {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = parseFloat(container.style.width) || container.offsetWidth;
          const startHeight = parseFloat(container.style.height) || container.offsetHeight;
          const startLeft = parseFloat(container.style.left) || container.offsetLeft;
          const startTop = parseFloat(container.style.top) || container.offsetTop;

          function onMouseMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (pos.includes('right')) {
              container.style.width = Math.max(200, startWidth + dx) + 'px';
            }
            if (pos.includes('bottom')) {
              container.style.height = Math.max(150, startHeight + dy) + 'px';
            }
            if (pos.includes('left')) {
              const newWidth = Math.max(200, startWidth - dx);
              container.style.width = newWidth + 'px';
              container.style.left = (startLeft + (startWidth - newWidth)) + 'px';
            }
            if (pos.includes('top')) {
              const newHeight = Math.max(150, startHeight - dy);
              container.style.height = newHeight + 'px';
              container.style.top = (startTop + (startHeight - newHeight)) + 'px';
            }
          }

          function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          }

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });

      // Create number div
      const numberDiv = document.createElement('div');
      numberDiv.className = 'vsm-number';
      container.appendChild(numberDiv);

      // Create close button
      const closeButton = document.createElement('div');
      closeButton.className = 'close-button';
      closeButton.textContent = 'X';
      container.appendChild(closeButton);
      closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const container = this.parentNode;
        container.remove();
        vsmTables = vsmTables.filter(c => c !== container);
        updateNumbers();
        updateOverallStats();
      });

      // Create table
      const table = document.createElement('table');
      table.className = 'vsm-table';
      table.innerHTML = `
        <tr><td>L/T (days): <input type="number" step="0.1" min="0" class="lead-time" value="${vsmData.leadTime}"></td></tr>
        <tr><td>P/T (minutes): <input type="number" step="1" min="0" class="process-time" value="${vsmData.processTime}"></td></tr>
        <tr><td>%C&A: <input type="number" min="0" max="100" class="percent-ca" value="${vsmData.percentCA}">%</td></tr>
      `;
      container.appendChild(table);

      // Add event listeners to inputs
      const inputs = table.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('change', updateOverallStats);
      });

      canvas.appendChild(container);
      vsmTables.push(container);
    });

    // Update VSM numbers and stats
    updateNumbers();
    updateOverallStats();

    const maxNodeId = mapData.nodes.reduce((max, node) => {
      const idNum = parseInt(node.id.replace('container', ''), 10);
      return idNum > max ? idNum : max;
    }, -1);
    nodeId = maxNodeId + 1;

    const maxSwimlaneId = mapData.swimlanes.reduce((max, swimlane) => {
      const idNum = parseInt(swimlane.id.replace('swimlane', ''), 10);
      return idNum > max ? idNum : max;
    }, -1);
    swimlaneId = maxSwimlaneId + 1;

    document.querySelectorAll('.node-container').forEach(container => container.classList.remove('selected'));
    updateNodeInfo(null);
    document.getElementById('edit-node').disabled = true;
    document.getElementById('instructions').textContent = 'Process map imported successfully.';
  }
  
  function updateDocumentTitle() {
    const title = document.getElementById('map-title').value || 'Untitled Map';
    document.title = `Process Map - ${title}`;
  }
  
  // Initially set the document title
  updateDocumentTitle();
  
  // Update document title when the map title changes
  document.getElementById('map-title').addEventListener('input', updateDocumentTitle);
  
  // Save map
  document.getElementById('save-map').addEventListener('click', exportMap);
  
  // Load map
  document.getElementById('load-map').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  
  document.getElementById('import-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const mapData = JSON.parse(e.target.result);
          importMap(mapData);
          event.target.value = '';//clear the file input after loading. Attempted fix for no load same map
        } catch (error) {
          console.error('Error parsing JSON:', error.message);
          alert('Failed to load the JSON file: ' + error.message);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  });