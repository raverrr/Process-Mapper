let addingConnector = false;
let startNode = null;
let endNode = null;

function populateConnectorList(container) {
  const connectorList = document.getElementById('connector-list');
  connectorList.innerHTML = '<h4>Connectors</h4>';
  const nodeConnectors = connections.filter(conn => conn.startNode === container || conn.endNode === container);
  if (nodeConnectors.length === 0) {
    connectorList.innerHTML += '<p>No connectors associated with this node.</p>';
  } else {
    nodeConnectors.forEach((conn, index) => {
      const startNodeEl = conn.startNode.querySelector('.node');
      const endNodeEl = conn.endNode.querySelector('.node');
      const connectorItem = document.createElement('div');
      connectorItem.className = 'connector-item';
      connectorItem.innerHTML = `
        <label>Connector ${index + 1} (from ${startNodeEl.textContent || startNodeEl.querySelector('div')?.textContent} to ${endNodeEl.textContent || endNodeEl.querySelector('div')?.textContent})</label>
        <label>Path Type:
          <select class="edit-path-type" data-index="${index}">
            <option value="straight" ${conn.config.path === 'straight' ? 'selected' : ''}>Straight</option>
            <option value="arc" ${conn.config.path === 'arc' ? 'selected' : ''}>Arc</option>
            <option value="fluid" ${conn.config.path === 'fluid' ? 'selected' : ''}>Fluid</option>
            <option value="magnet" ${conn.config.path === 'magnet' ? 'selected' : ''}>Magnet</option>
            <option value="dash" ${conn.config.path === 'dash' ? 'selected' : ''}>Dotted Line</option>
          </select>
        </label>
        <label>Label: <input type="text" class="edit-connector-label" value="${conn.config.label || ''}" data-index="${index}"></label>
        <button type="button" class="delete-connector" data-index="${index}">Delete</button>
      `;
      connectorList.appendChild(connectorItem);
    });
  }
}

// Add connector
document.getElementById('add-connector').addEventListener('click', () => {
  const selectedContainer = document.querySelector('.node-container.selected');
  if (!selectedContainer) {
    document.getElementById('instructions').textContent = 'Please select a node first.';
    return;
  }
  startNode = selectedContainer;
  addingConnector = true;
  document.getElementById('instructions').textContent = 'Select the target node for the connector.';
});

// Submit connector form
document.getElementById('connector-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const pathType = document.getElementById('connector-path-type').value;
  const label = document.getElementById('connector-label').value;
  const lineOptions = {
    path: pathType,
    endPlug: 'arrow1',
    color: '#E0E0E0',
    size: 2,
    dash: pathType === 'dash' ? { animation: true } : false,
    ...(label && { middleLabel: LeaderLine.captionLabel(label, { color: '#333' }) }),
    startSocket: 'auto',
    endSocket: 'auto',
    parent: canvas
  };
  const startNodeEl = startNode.querySelector('.node');
  const endNodeEl = endNode.querySelector('.node');
  const line = new LeaderLine(startNodeEl, endNodeEl, lineOptions);
  connections.push({ line, config: { path: pathType, label }, startNode, endNode });
  document.getElementById('connector-modal').style.display = 'none';
  document.getElementById('connector-label').value = '';
  addingConnector = false;
  document.getElementById('instructions').textContent = '';
  startNode = null;
  endNode = null;
});

// Delete connector
document.getElementById('connector-list').addEventListener('click', e => {
  if (e.target.classList.contains('delete-connector')) {
    const index = parseInt(e.target.getAttribute('data-index'), 10);
    const selectedContainer = document.querySelector('.node-container.selected');
    const nodeConnectors = connections.filter(conn => conn.startNode === selectedContainer || conn.endNode === selectedContainer);
    const conn = nodeConnectors[index];
    conn.line.remove();
    connections = connections.filter(c => c !== conn);
    document.getElementById('instructions').textContent = nodeTypeDescriptions[document.getElementById('edit-node-type').value];
    populateConnectorList(selectedContainer);
  }
});

// Handle connector visibility on scroll
canvas.addEventListener('scroll', () => {
  const canvasRect = canvas.getBoundingClientRect();
  connections.forEach(conn => {
    const line = conn.line;
    const startElement = line.start;
    const endElement = line.end;

    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    const isOutside = (
      (startRect.top < canvasRect.top || endRect.top < canvasRect.top) ||
      (startRect.bottom > canvasRect.bottom || endRect.bottom > canvasRect.bottom) ||
      (startRect.left < canvasRect.left || endRect.left < canvasRect.left) ||
      (startRect.right > canvasRect.right || endRect.right > canvasRect.right)
    );

    if (isOutside) {
      line.hide('none');
    } else {
      line.show('none');
      line.position();
    }
  });
});