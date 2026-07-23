import express from 'express';
import cors from 'cors';
import matrixRoute from './routes/matrixRoute.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/', matrixRoute);

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware de errores global
app.use((err, req, res, next) => {
    console.error('Error interno:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;