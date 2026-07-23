import { Router } from 'express';
import { Controller as MatrixController } from '../Controller.js';

const router = Router();

// Operaciones soportadas
const SUPPORTED_OPS = new Set([
    'add', 'subtract', 'multiply', 'dot', 'cross', 'scalar', 'inverse', 'transpose'
]);

router.post('/calculate', (req, res) => {
    const { operation, a, b } = req.body;

    console.log(`[${new Date().toISOString()}] POST /calculate | op: ${operation}`);

    if (!operation || typeof operation !== 'string') {
        return res.status(400).json({ error: 'operation es requerido' });
    }
    if (!SUPPORTED_OPS.has(operation)) {
        return res.status(400).json({ error: `Operación '${operation}' no soportada` });
    }
    if (!Array.isArray(a) || a.length === 0) {
        return res.status(400).json({ error: 'a debe ser una matriz no vacía' });
    }

    try {
        const controller = new MatrixController(a);
        let result;

        const unaryOps = ['inverse', 'transpose'];
        if (unaryOps.includes(operation)) {
            result = controller[operation]();
        } else if (operation === 'scalar') {
            if (typeof b !== 'number' || isNaN(b)) {
                return res.status(400).json({ error: 'b debe ser un número (escalar)' });
            }
            result = controller.scalar(b);
        } else {
            if (!Array.isArray(b) || b.length === 0) {
                return res.status(400).json({ error: 'b debe ser una matriz no vacía' });
            }
            const other = new MatrixController(b);
            result = controller[operation](other);
        }

        let responseData;
        if (typeof result === 'number') {
            responseData = result;
        } else if (result && typeof result === 'object' && result.data) {
            responseData = result.data;
        } else {
            responseData = result;
        }

        console.log(' -> 200 OK');
        return res.json({ result: responseData });

    } catch (error) {
        console.log(` -> 400 | error: ${error.message}`);
        return res.status(400).json({ error: error.message });
    }
});

export default router;
