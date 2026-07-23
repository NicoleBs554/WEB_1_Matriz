export class Controller {
    #data;
    #size;

    constructor(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('La matriz debe ser un arreglo no vacío');
        }

        // Validar que sea cuadrada y todos números
        const size = data.length;
        const isValid = data.every(row =>
            Array.isArray(row) &&
            row.length === size &&
            row.every(v => typeof v === 'number' && !isNaN(v))
        );
        if (!isValid) {
            throw new Error('La matriz debe ser cuadrada (NxN) con números válidos');
        }

        this.#data = data;
        this.#size = size;
    }

    get data() { return this.#data; }
    get size() { return this.#size; }

    // Validación de mismo tamaño
    #validateSameSize(other) {
        if (!(other instanceof Controller)) {
            throw new Error('El argumento debe ser una instancia de Controller');
        }
        if (other.size !== this.#size) {
            throw new Error('Las matrices deben tener el mismo tamaño');
        }
    }

    // ---- Operaciones ----

    // Suma
    add(other) {
        this.#validateSameSize(other);
        const result = this.#data.map((row, i) =>
            row.map((val, j) => val + other.data[i][j])
        );
        return new Controller(result);
    }

    // Resta
    subtract(other) {
        this.#validateSameSize(other);
        const result = this.#data.map((row, i) =>
            row.map((val, j) => val - other.data[i][j])
        );
        return new Controller(result);
    }

    // Multiplicación matricial
    multiply(other) {
        this.#validateSameSize(other);
        const n = this.#size;
        const result = this.#data.map((row, i) =>
            Array.from({ length: n }, (_, j) =>
                row.reduce((sum, val, k) => sum + val * other.data[k][j], 0)
            )
        );
        return new Controller(result);
    }

    // Producto punto (escalar)
    dot(other) {
        this.#validateSameSize(other);
        let sum = 0;
        for (let i = 0; i < this.#size; i++) {
            for (let j = 0; j < this.#size; j++) {
                sum += this.#data[i][j] * other.data[i][j];
            }
        }
        return sum;
    }

    // Producto cruz (Hadamard)
    cross(other) {
        this.#validateSameSize(other);
        const result = this.#data.map((row, i) =>
            row.map((val, j) => val * other.data[i][j])
        );
        return new Controller(result);
    }

    // Multiplicación por escalar
    scalar(k) {
        if (typeof k !== 'number' || isNaN(k)) {
            throw new Error('El escalar debe ser un número');
        }
        const result = this.#data.map(row => row.map(val => val * k));
        return new Controller(result);
    }

    // Transpuesta
    transpose() {
        const n = this.#size;
        const result = Array.from({ length: n }, (_, j) =>
            this.#data.map(row => row[j])
        );
        return new Controller(result);
    }

    // Inversa (Gauss-Jordan)
    inverse() {
        const n = this.#size;
        if (n === 1) {
            const val = this.#data[0][0];
            if (val === 0) throw new Error('Matriz singular, no se puede invertir');
            return new Controller([[1 / val]]);
        }

        // Matriz aumentada [A | I]
        const aug = this.#data.map((row, i) => [
            ...row,
            ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
        ]);

        // Gauss-Jordan
        for (let col = 0; col < n; col++) {
            // Pivoteo parcial
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                    maxRow = row;
                }
            }
            [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

            // Verificar singularidad
            if (Math.abs(aug[col][col]) < 1e-12) {
                throw new Error('Matriz singular, no se puede invertir');
            }

            // Normalizar fila pivote
            const pivot = aug[col][col];
            aug[col] = aug[col].map(v => v / pivot);

            // Eliminar columna en las demás filas
            for (let row = 0; row < n; row++) {
                if (row === col) continue;
                const factor = aug[row][col];
                aug[row] = aug[row].map((v, j) => v - factor * aug[col][j]);
            }
        }

        // Extraer inversa (parte derecha)
        const result = aug.map(row => row.slice(n));
        return new Controller(result);
    }
}