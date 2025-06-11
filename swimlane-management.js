// Swimlane resizing
interact('.swimlane').resizable({
    edges: { bottom: '.swimlane-resize-handle' },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { height: 50 },
        max: { height: 400 }
      })
    ],
    onmove: event => {
      const target = event.target;
      const newHeight = event.rect.height;
      target.style.height = `${newHeight}px`;
      const swimlanes = Array.from(document.querySelectorAll('.swimlane')).sort((a, b) => parseFloat(a.style.top || 0) - parseFloat(b.style.top || 0));
      const currentIndex = swimlanes.indexOf(target);
      for (let i = currentIndex + 1; i < swimlanes.length; i++) {
        const prevSwimlane = swimlanes[i - 1];
        const prevTop = parseFloat(prevSwimlane.style.top || 0);
        const prevHeight = parseFloat(prevSwimlane.style.height || 100);
        swimlanes[i].style.top = `${prevTop + prevHeight}px`;
      }
    }
  });
  
  // Add swimlane
  document.getElementById('add-swimlane').addEventListener('click', () => {
    document.getElementById('swimlane-modal').style.display = 'block';
    document.getElementById('instructions').textContent = '';
  });
  
  // Submit swimlane form
  document.getElementById('swimlane-form').addEventListener('submit', e => {
    e.preventDefault();
    const label = document.getElementById('swimlane-label').value;
    const color = document.getElementById('swimlane-color').value;
  
    const newSwimlane = document.createElement('div');
    newSwimlane.id = `swimlane${swimlaneId}`;
    newSwimlane.className = `swimlane swimlane-color-${color}`;
    newSwimlane.innerHTML = `<span class="swimlane-label">${label}</span><div class="swimlane-resize-handle"></div>`;
    const swimlanes = Array.from(document.querySelectorAll('.swimlane')).sort((a, b) => parseFloat(a.style.top || 0) - parseFloat(b.style.top || 0));
    let newTop = 0;
    if (swimlanes.length > 0) {
      const lastSwimlane = swimlanes[swimlanes.length - 1];
      newTop = parseFloat(lastSwimlane.style.top || 0) + parseFloat(lastSwimlane.style.height || 100);
    }
    newSwimlane.style.top = `${newTop}px`;
    newSwimlane.style.height = '100px';
    canvas.appendChild(newSwimlane);
    swimlaneId++;
  
    document.getElementById('swimlane-modal').style.display = 'none';
    document.getElementById('swimlane-label').value = '';
    document.getElementById('swimlane-color').value = 'gray';
    document.getElementById('instructions').textContent = '';
  });