// app.js - Cliente optimizado con fetch

(function() {
    "use strict";

    // Configuración
    const API_URL = 'http://localhost:3000/calculate';

    // Estado
    let currentOperation = 'add';
    let sizeA = 3;
    let sizeB = 3;
    const matrixA = document.getElementById('matrixA');
    const matrixB = document.getElementById('matrixB');
    const resultGrid = document.getElementById('resultGrid');
    const sizeASpan = document.getElementById('sizeA');
    const sizeBSpan = document.getElementById('sizeB');

    // Inicialización
    function init() {
        renderMatrix(matrixA, sizeA);
        renderMatrix(matrixB, sizeB);
        bindEvents();
        setActiveOperation('add');
    }

    // Renderizar matriz (inputs)
    function renderMatrix(container, size) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${size}, 60px)`;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = '0';
                input.dataset.row = r;
                input.dataset.col = c;
                container.appendChild(input);
            }
        }
    }

    // Leer matriz desde inputs
    function readMatrix(container, size) {
        const matrix = [];
        for (let r = 0; r < size; r++) {
            const row = [];
            for (let c = 0; c < size; c++) {
                const input = container.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                row.push(input ? parseFloat(input.value) || 0 : 0);
            }
            matrix.push(row);
        }
        return matrix;
    }

    // Escribir matriz en inputs
    function writeMatrix(container, matrix, size) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const input = container.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                if (input) input.value = matrix[r][c];
            }
        }
    }

    // Llenar con valores aleatorios
    function randomizeMatrix(container, size) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const input = container.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                if (input) input.value = Math.floor(Math.random() * 20) - 9; // entre -9 y 10
            }
        }
    }

    // Mostrar resultado (matriz o escalar)
    function displayResult(data) {
        resultGrid.innerHTML = '';
        if (Array.isArray(data) && data.length > 0) {
            const rows = data.length;
            const cols = data[0].length;
            resultGrid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'result-cell';
                    cell.textContent = typeof data[r][c] === 'number' ? parseFloat(data[r][c].toFixed(6)) : data[r][c];
                    resultGrid.appendChild(cell);
                }
            }
        } else if (typeof data === 'number') {
            // Escalar
            resultGrid.style.gridTemplateColumns = '1fr';
            const cell = document.createElement('div');
            cell.className = 'result-cell';
            cell.textContent = parseFloat(data.toFixed(6));
            cell.style.width = 'auto';
            cell.style.padding = '0 20px';
            resultGrid.appendChild(cell);
        } else {
            resultGrid.style.gridTemplateColumns = '1fr';
            const msg = document.createElement('div');
            msg.className = 'error-msg';
            msg.textContent = 'Resultado no válido';
            resultGrid.appendChild(msg);
        }
    }

    function showError(message) {
        resultGrid.innerHTML = '';
        resultGrid.style.gridTemplateColumns = '1fr';
        const msg = document.createElement('div');
        msg.className = 'error-msg';
        msg.textContent = 'Error: ' + message;
        resultGrid.appendChild(msg);
    }

    function showLoading() {
        resultGrid.innerHTML = '';
        resultGrid.style.gridTemplateColumns = '1fr';
        const msg = document.createElement('div');
        msg.className = 'loading-msg';
        msg.textContent = 'Calculando...';
        resultGrid.appendChild(msg);
    }

    function clearResult() {
        resultGrid.innerHTML = '';
        resultGrid.style.gridTemplateColumns = '1fr';
        const msg = document.createElement('div');
        msg.className = 'loading-msg';
        msg.textContent = 'Esperando cálculo...';
        resultGrid.appendChild(msg);
    }

    // ----- Operación principal (fetch) -----
    async function calculate() {
        // Construir body según operación
        const op = currentOperation;
        const body = { operation: op };

        // Para operaciones unarias (inverse, transpose) solo se necesita A
        const unaryOps = ['inverse', 'transpose'];
        if (unaryOps.includes(op)) {
            body.a = readMatrix(matrixA, sizeA);
        } else if (op === 'scalar') {
            // Para escalar, necesitamos A y un número (lo tomamos de la primera celda de B o de un input adicional)
            // Por simplicidad, pedimos al usuario que ingrese el escalar en la posición (0,0) de B
            // Pero mejor: añadir un input específico. En esta versión, usamos un valor fijo o lo tomamos de B[0][0].
            // Para no complicar, asumimos que el escalar se ingresa en la celda (0,0) de B.
            const bMatrix = readMatrix(matrixB, sizeB);
            const scalar = (bMatrix[0] && bMatrix[0][0] !== undefined) ? bMatrix[0][0] : 0;
            body.a = readMatrix(matrixA, sizeA);
            body.b = scalar;
        } else {
            // Operaciones binarias
            body.a = readMatrix(matrixA, sizeA);
            body.b = readMatrix(matrixB, sizeB);
        }

        showLoading();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.error || 'Error del servidor');
                return;
            }

            displayResult(data.result);
        } catch (error) {
            showError('Error de conexión con el servidor');
        }
    }

    // ----- Eventos -----
    function bindEvents() {
        // Botones de operación
        document.querySelectorAll('.operations button').forEach(btn => {
            btn.addEventListener('click', function() {
                const op = this.dataset.op;
                setActiveOperation(op);
                currentOperation = op;
                clearResult();
            });
        });

        // Tamaños
        document.getElementById('decreaseA').addEventListener('click', () => changeSize('A', -1));
        document.getElementById('increaseA').addEventListener('click', () => changeSize('A', 1));
        document.getElementById('decreaseB').addEventListener('click', () => changeSize('B', -1));
        document.getElementById('increaseB').addEventListener('click', () => changeSize('B', 1));

        // Aleatorios
        document.getElementById('randomA').addEventListener('click', () => randomizeMatrix(matrixA, sizeA));
        document.getElementById('randomB').addEventListener('click', () => randomizeMatrix(matrixB, sizeB));

        // Acciones
        document.getElementById('calculateBtn').addEventListener('click', calculate);
        document.getElementById('swapBtn').addEventListener('click', swapMatrices);
        document.getElementById('clearBtn').addEventListener('click', clearAll);

        // Limpiar resultado al cambiar tamaño o aleatorio (opcional)
    }

    function setActiveOperation(op) {
        document.querySelectorAll('.operations button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.op === op);
        });
    }

    function changeSize(which, delta) {
        let newSize;
        if (which === 'A') {
            newSize = Math.max(1, Math.min(8, sizeA + delta));
            if (newSize === sizeA) return;
            sizeA = newSize;
            renderMatrix(matrixA, sizeA);
            sizeASpan.textContent = sizeA;
        } else {
            newSize = Math.max(1, Math.min(8, sizeB + delta));
            if (newSize === sizeB) return;
            sizeB = newSize;
            renderMatrix(matrixB, sizeB);
            sizeBSpan.textContent = sizeB;
        }
        clearResult();
    }

    function swapMatrices() {
        const dataA = readMatrix(matrixA, sizeA);
        const dataB = readMatrix(matrixB, sizeB);
        // Intercambiar tamaños también
        const tempSize = sizeA;
        sizeA = sizeB;
        sizeB = tempSize;
        renderMatrix(matrixA, sizeA);
        renderMatrix(matrixB, sizeB);
        writeMatrix(matrixA, dataB, sizeA);
        writeMatrix(matrixB, dataA, sizeB);
        sizeASpan.textContent = sizeA;
        sizeBSpan.textContent = sizeB;
        clearResult();
    }

    function clearAll() {
        // Resetear a ceros
        const inputsA = matrixA.querySelectorAll('input');
        inputsA.forEach(inp => inp.value = '0');
        const inputsB = matrixB.querySelectorAll('input');
        inputsB.forEach(inp => inp.value = '0');
        clearResult();
    }

    // Inicio
    init();
})();