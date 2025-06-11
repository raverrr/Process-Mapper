function updateNodeInfo(container) {
    const notesTextarea = document.getElementById('notes');
    const ownersTextarea = document.getElementById('owners');
    const nodeInfo = document.getElementById('node-info');
    if (container) {
      const containerId = container.id;
      const data = nodeData[containerId];
      notesTextarea.value = data.notes;
      ownersTextarea.value = data.owners;
      notesTextarea.disabled = false;
      ownersTextarea.disabled = false;
      nodeInfo.style.display = 'block'; // Show when a node is selected
    } else {
      notesTextarea.value = '';
      ownersTextarea.value = '';
      notesTextarea.disabled = true;
      ownersTextarea.disabled = true;
      nodeInfo.style.display = 'none'; // Hide when no node is selected
    }
  }

  // Ensure canvas click deselects nodes and hides node-info, but ignores modal clicks
canvas.addEventListener('click', e => {
    const targetContainer = e.target.closest('.node-container');
    const isInsideModal = e.target.closest('#node-edit-modal');
    if (isInsideModal) {
      return; // Ignore clicks inside the modal, preserving the selected node
    }
    if (targetContainer) {
      updateNodeInfo(targetContainer);
    } else {
      document.querySelectorAll('.node-container').forEach(container => container.classList.remove('selected'));
      document.getElementById('edit-node').disabled = true;
      document.getElementById('instructions').textContent = '';
      updateNodeInfo(null); // Hide node-info on deselection
    }
  });
  
  // Create grid background and guideline
  const gridBackground = document.createElement('div');
  gridBackground.className = 'grid-background';
  canvas.appendChild(gridBackground);
  
  const guideline = document.createElement('div');
  guideline.className = 'guideline';
  canvas.appendChild(guideline);
  
  // Create initial start node
  const startContainer = document.createElement('div');
  startContainer.className = 'node-container';
  startContainer.id = `container${nodeId}`;
  const initialLeft = 100;
  const initialTop = 100;
  startContainer.style.left = `${initialLeft}px`;
  startContainer.style.top = `${initialTop}px`;
  const startNodeEl = document.createElement('div');
  startNodeEl.className = 'node start-end';
  startNodeEl.textContent = 'Process Start';
  startContainer.appendChild(startNodeEl);
  canvas.appendChild(startContainer);
  nodeData[startContainer.id] = { notes: '', owners: '' };
  nodeId++;
  
  // Node dragging with alignment guideline
  interact('.node-container').draggable({
    onmove: event => {
      const target = event.target;
      const x = (parseFloat(target.style.left) || 0) + event.dx;
      const y = (parseFloat(target.style.top) || 0) + event.dy;
      target.style.left = `${x}px`;
      target.style.top = `${y}px`;
  
      const allContainers = Array.from(document.querySelectorAll('.node-container')).filter(container => container !== target);
      let closestTop = null;
      let minDiff = Infinity;
      allContainers.forEach(container => {
        const containerTop = parseFloat(container.style.top) || 0;
        const diff = Math.abs(y - containerTop);
        if (diff < minDiff && diff < 10) {
          minDiff = diff;
          closestTop = containerTop;
        }
      });
      if (closestTop !== null) {
        guideline.style.top = `${closestTop}px`;
        guideline.style.display = 'block';
      } else {
        guideline.style.display = 'none';
      }
  
      connections.filter(conn => conn.startNode === target || conn.endNode === target).forEach(conn => conn.line.position());
    },
    onend: () => {
      guideline.style.display = 'none';
    }
  });
  
  // Handle canvas clicks for node selection
  canvas.addEventListener('click', e => {
    const targetContainer = e.target.closest('.node-container');
    if (targetContainer) {
      if (addingConnector) {
        endNode = targetContainer;
        if (endNode !== startNode) {
          document.getElementById('connector-modal').style.display = 'block';
          addingConnector = false;
          document.getElementById('instructions').textContent = '';
        } else {
          document.getElementById('instructions').textContent = 'Cannot connect a node to itself. Select a different target node.';
        }
      } else {
        document.querySelectorAll('.node-container').forEach(container => container.classList.remove('selected'));
        targetContainer.classList.add('selected');
        document.getElementById('edit-node').disabled = false;
        document.getElementById('instructions').textContent = '';
        updateNodeInfo(targetContainer);
      }
    } else if (e.target.id === 'canvas' || e.target.classList.contains('swimlane') || e.target.classList.contains('swimlane-label')) {
      document.querySelectorAll('.node-container').forEach(container => container.classList.remove('selected'));
      document.getElementById('edit-node').disabled = true;
      document.getElementById('instructions').textContent = '';
      updateNodeInfo(null);
    }
  });
  
  // Add node
  document.getElementById('add-node').addEventListener('click', () => {
    const selectedContainer = document.querySelector('.node-container.selected');
    if (!selectedContainer) {
      document.getElementById('instructions').textContent = 'Please select a node first.';
      return;
    }
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    const selectedNode = selectedContainer.querySelector('.node');
    const isDecision = selectedNode.classList.contains('decision');
    document.getElementById('label-field').style.display = isDecision ? 'block' : 'none';
    document.getElementById('instructions').textContent = 'Select a node type to see its description.';
  });
  
  // Node type description updates
  const nodeTypeSelects = [document.getElementById('node-type'), document.getElementById('edit-node-type')];
  nodeTypeSelects.forEach(select => {
    select.addEventListener('change', e => {
      const description = e.target.options[e.target.selectedIndex].getAttribute('data-description') || 'Select a node type to see its description.';
      document.getElementById('instructions').textContent = description;
    });
  });
  
  // Submit new node form
  document.getElementById('node-form').addEventListener('submit', e => {
    e.preventDefault();
    const selectedContainer = document.querySelector('.node-container.selected');
    const selectedNode = selectedContainer.querySelector('.node');
    const type = document.getElementById('node-type').value;
    const name = document.getElementById('node-name').value;
    const pathType = document.getElementById('node-path-type').value;
    const label = document.getElementById('label-field').style.display === 'block' ?
      document.getElementById('connection-label').value : '';
    const alignHorizontal = document.getElementById('align-horizontal').checked;
  
    const selectedType = getNodeType(selectedNode);
    const selectedHeight = parseFloat(selectedContainer.style.height) || getNodeHeight(selectedType);
    const newHeight = getNodeHeight(type);
  
    const selectedLeft = parseFloat(selectedContainer.style.left) || 0;
    const selectedTop = parseFloat(selectedContainer.style.top) || 0;
    const offset = 150;
  
    let newLeft, newTop;
    if (alignHorizontal) {
      const centerOffset = selectedHeight / 2 - newHeight / 2;
      newTop = selectedTop + centerOffset;
      newLeft = selectedLeft + offset;
    } else {
      newTop = selectedTop + selectedHeight + offset;
      newLeft = selectedLeft;
    }
  
    const newContainer = document.createElement('div');
    newContainer.className = 'node-container';
    newContainer.id = `container${nodeId}`;
    newContainer.style.left = `${newLeft}px`;
    newContainer.style.top = `${newTop}px`;
    newContainer.style.height = `${newHeight}px`;
    const newNode = document.createElement('div');
    newNode.className = `node ${type}`;
    if (type === 'decision' || type === 'input-output') {
      newNode.innerHTML = `<div>${name}</div>`;
    } else {
      newNode.textContent = name;
    }
    newContainer.appendChild(newNode);
    canvas.appendChild(newContainer);
    nodeData[newContainer.id] = { notes: '', owners: '' };
    nodeId++;
  
    const isDash = pathType === 'dash';
    const basePath = isDash ? 'straight' : pathType;
    const finalPath = alignHorizontal ? 'straight' : basePath;
    const dashOption = isDash ? { animation: true } : false;
  
    const lineOptions = {
      endPlug: 'arrow1',
      path: finalPath,
      color: '#E0E0E0',
      size: 2,
      dash: dashOption,
      ...(label && { middleLabel: LeaderLine.captionLabel(label, { color: '#333' }) }),
      startSocket: 'auto',
      endSocket: 'auto',
      parent: canvas
    };
    const startNodeEl = selectedContainer.querySelector('.node');
    const endNodeEl = newContainer.querySelector('.node');
    const line = new LeaderLine(startNodeEl, endNodeEl, lineOptions);
    connections.push({ line, config: { path: finalPath, label }, startNode: selectedContainer, endNode: newContainer });
  
    document.getElementById('modal').style.display = 'none';
    document.getElementById('node-name').value = '';
    document.getElementById('connection-label').value = '';
    document.getElementById('align-horizontal').checked = false;
    document.getElementById('instructions').textContent = '';
  });
  
  // Edit node
  document.getElementById('edit-node').addEventListener('click', () => {
    const selectedContainer = document.querySelector('.node-container.selected');
    if (selectedContainer) {
      const selectedNode = selectedContainer.querySelector('.node');
      const currentType = getNodeType(selectedNode);
      document.getElementById('edit-node-type').value = currentType;
      document.getElementById('edit-node-name').value = selectedNode.textContent || selectedNode.querySelector('div')?.textContent;
      document.getElementById('instructions').textContent = nodeTypeDescriptions[currentType];
      populateConnectorList(selectedContainer);
      document.getElementById('node-edit-modal').style.display = 'block';
    }
  });
  
  // Submit node edit form
  document.getElementById('node-edit-form').addEventListener('submit', e => {
    e.preventDefault();
    const selectedContainer = document.querySelector('.node-container.selected');
    if (selectedContainer) {
      const selectedNode = selectedContainer.querySelector('.node');
      const newType = document.getElementById('edit-node-type').value;
      const newName = document.getElementById('edit-node-name').value;
      selectedNode.className = `node ${newType}`;
      const newHeight = getNodeHeight(newType);
      selectedContainer.style.height = `${newHeight}px`;
      if (newType === 'decision' || newType === 'input-output') {
        selectedNode.innerHTML = `<div>${newName}</div>`;
      } else {
        selectedNode.textContent = newName;
      }
  
      // Update all connectors
      const connectorItems = document.querySelectorAll('#connector-list .connector-item');
      connectorItems.forEach(item => {
        const select = item.querySelector('.edit-path-type');
        const input = item.querySelector('.edit-connector-label');
        const index = parseInt(select.getAttribute('data-index'), 10);
        const pathType = select.value;
        const label = input.value;
        const nodeConnectors = connections.filter(conn => conn.startNode === selectedContainer || conn.endNode === selectedContainer);
        const conn = nodeConnectors[index];
        if (conn) {
          conn.line.setOptions({
            path: pathType,
            dash: pathType === 'dash' ? { animation: true } : false,
            middleLabel: label ? LeaderLine.captionLabel(label, { color: '#333' }) : null
          });
          conn.config.path = pathType;
          conn.config.label = label;
        }
      });
  
      document.getElementById('node-edit-modal').style.display = 'none';
      document.getElementById('instructions').textContent = '';
    }
  });
  
  // Delete node
  document.getElementById('delete-node').addEventListener('click', () => {
    const selectedContainer = document.querySelector('.node-container.selected');
    if (selectedContainer) {
      // Remove the node from the canvas
      selectedContainer.remove();
      // Remove associated connections
      connections = connections.filter(conn => {
        if (conn.startNode === selectedContainer || conn.endNode === selectedContainer) {
          conn.line.remove();
          return false;
        }
        return true;
      });
      // Remove node data
      delete nodeData[selectedContainer.id];
      // Update UI
      updateNodeInfo(null);
      document.getElementById('edit-node').disabled = true;
      document.querySelectorAll('.node-container').forEach(container => container.classList.remove('selected'));
      // Close the modal
      document.getElementById('node-edit-modal').style.display = 'none';
      document.getElementById('instructions').textContent = 'Node deleted.';
    }
  });
  
  // Update node notes and owners
  document.getElementById('notes').addEventListener('input', () => {
    const selectedContainer = document.querySelector('.node-container.selected');
    if (selectedContainer) {
      const containerId = selectedContainer.id;
      nodeData[containerId].notes = document.getElementById('notes').value;
    }
  });
  
  document.getElementById('owners').addEventListener('input', () => {
    const selectedContainer = document.querySelector('.node-container.selected');
    if (selectedContainer) {
      const containerId = selectedContainer.id;
      nodeData[containerId].owners = document.getElementById('owners').value;
    }
  });