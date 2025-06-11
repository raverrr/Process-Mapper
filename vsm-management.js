let vsmTables = [];

function updateNumbers() {
    vsmTables.forEach((container, index) => {
        const numberDiv = container.querySelector('.vsm-number');
        if (numberDiv) {
            numberDiv.textContent = `VSM ${index + 1}`;
        }
    });
}

document.getElementById('add-vsm').addEventListener('click', function() {
    const container = document.createElement('div');
    container.className = 'vsm-container';
    container.style.top = (100 + vsmTables.length * 20) + 'px';
    container.style.left = (100 + vsmTables.length * 20) + 'px';

    // Create drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    container.appendChild(dragHandle);

    // Add drag functionality
    dragHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = container.offsetLeft;
        const startTop = container.offsetTop;

        function onMouseMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.style.left = startLeft + dx + 'px';
            container.style.top = startTop + dy + 'px';
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
            const startWidth = container.offsetWidth;
            const startHeight = container.offsetHeight;
            const startLeft = container.offsetLeft;
            const startTop = container.offsetTop;

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
                    container.style.left = startLeft + (startWidth - newWidth) + 'px';
                }
                if (pos.includes('top')) {
                    const newHeight = Math.max(150, startHeight - dy);
                    container.style.height = newHeight + 'px';
                    container.style.top = startTop + (startHeight - newHeight) + 'px';
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
        <tr><td>L/T (days): <input type="number" step="0.1" min="0" class="lead-time"></td></tr>
        <tr><td>P/T (minutes): <input type="number" step="1" min="0" class="process-time"></td></tr>
        <tr><td>%C&A: <input type="number" min="0" max="100" value="100" class="percent-ca">%</td></tr>
    `;
    container.appendChild(table);

    // Add event listeners to inputs
    const inputs = table.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', updateOverallStats);
    });

    // Append to canvas instead of vsm-area
    document.getElementById('canvas').appendChild(container);
    vsmTables.push(container);
    updateNumbers();
    updateOverallStats();
});

function updateOverallStats() {
    const ltInputs = document.querySelectorAll('.lead-time');
    const ptInputs = document.querySelectorAll('.process-time');
    const caInputs = document.querySelectorAll('.percent-ca');

    let sumLeadTimesDays = 0;
    let sumProcessTimesMinutes = 0;
    let productCA = 1;

    ltInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        sumLeadTimesDays += value;
    });

    ptInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        sumProcessTimesMinutes += value;
    });

    caInputs.forEach(input => {
        const value = parseFloat(input.value) || 100;
        productCA *= value / 100;
    });

    const totalLeadTimeMinutes = sumLeadTimesDays * 24 * 60;
    const pce = totalLeadTimeMinutes > 0 ? (sumProcessTimesMinutes / totalLeadTimeMinutes) * 100 : 0;
    const overallPercent = productCA * 100;

    document.getElementById('overall-percent').textContent = overallPercent.toFixed(2);
    document.getElementById('pce').textContent = pce.toFixed(2);
}